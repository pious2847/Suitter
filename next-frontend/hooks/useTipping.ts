import { useCallback, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import CONFIG from "../config";

const PACKAGE_ID = CONFIG.VITE_PACKAGE_ID;
const TIP_BALANCE_REGISTRY = CONFIG.TIP_BALANCE_REGISTRY;
const MIN_TIP_AMOUNT = 0.01; // 0.01 SUI minimum

export function useTipping() {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const address = account?.address ?? null;

  const [isTipping, setIsTipping] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isCreatingBalance, setIsCreatingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get or create tip balance for user
  const getOrCreateTipBalance = useCallback(
    async (userAddress: string) => {
      try {
        console.log("Looking for TipBalance for:", userAddress);
        
        // Try to get the TipBalance ID from the registry's Table
        try {
          // First get the registry to find the Table ID
          const registryObj = await suiClient.getObject({
            id: TIP_BALANCE_REGISTRY,
            options: { showContent: true },
          });

          const registryContent = registryObj.data?.content as any;
          const tableId = registryContent?.fields?.balances?.fields?.id?.id;

          if (tableId) {
            // Query the Table's dynamic field for this address
            const dynamicField = await suiClient.getDynamicFieldObject({
              parentId: tableId,
              name: {
                type: "address",
                value: userAddress,
              },
            });

            if (dynamicField.data) {
              const balanceId = (dynamicField.data.content as any)?.fields?.value;
              if (balanceId) {
                console.log("Found existing TipBalance:", balanceId);
                return balanceId;
              }
            }
          }
        } catch (fieldErr: any) {
          // Field doesn't exist, need to create
          console.log("No existing TipBalance, will create:", fieldErr.message);
        }

        // Create a new TipBalance
        console.log("Creating TipBalance for:", userAddress);
        setIsCreatingBalance(true);
        const tx = new Transaction();

        // Call create_tip_balance
        tx.moveCall({
          target: `${PACKAGE_ID}::tipping::create_tip_balance`,
          arguments: [
            tx.object(TIP_BALANCE_REGISTRY),
          ],
        });

        const { digest } = await signAndExecute({ transaction: tx });
        await suiClient.waitForTransaction({ digest });

        console.log("Transaction completed, fetching TipBalance from registry...");

        // After transaction, query the registry's Table to get the TipBalance ID
        const registryObj = await suiClient.getObject({
          id: TIP_BALANCE_REGISTRY,
          options: { showContent: true },
        });

        const registryContent = registryObj.data?.content as any;
        const tableId = registryContent?.fields?.balances?.fields?.id?.id;

        setIsCreatingBalance(false);

        if (tableId) {
          const dynamicField = await suiClient.getDynamicFieldObject({
            parentId: tableId,
            name: {
              type: "address",
              value: userAddress,
            },
          });

          if (dynamicField.data) {
            const balanceId = (dynamicField.data.content as any)?.fields?.value;
            if (balanceId) {
              console.log("TipBalance created/found:", balanceId);
              return balanceId;
            }
          }
        }

        console.error("Failed to get TipBalance ID from registry");
        return null;
      } catch (err: any) {
        console.error("Error getting/creating tip balance:", err);
        setIsCreatingBalance(false);
        return null;
      }
    },
    [suiClient, signAndExecute]
  );

  // Tip a suit
  const tipSuit = useCallback(
    async (suitId: string, recipientAddress: string, amount: number) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      if (amount < MIN_TIP_AMOUNT) {
        setError(`Minimum tip amount is ${MIN_TIP_AMOUNT} SUI`);
        return null;
      }

      if (address === recipientAddress) {
        setError("You cannot tip your own post");
        return null;
      }

      setIsTipping(true);
      setError(null);

      try {
        console.log("Starting tip process...");
        console.log("Registry ID:", TIP_BALANCE_REGISTRY);
        console.log("Package ID:", PACKAGE_ID);
        
        // Verify registry exists
        try {
          const registry = await suiClient.getObject({
            id: TIP_BALANCE_REGISTRY,
            options: { showContent: true },
          });
          console.log("Registry found:", registry.data);
        } catch (regErr) {
          console.error("Registry not found:", regErr);
          throw new Error("TipBalanceRegistry not found. The tipping system may not be initialized.");
        }

        // Try to get recipient's tip balance (they must have created it first)
        let recipientBalanceId: string | null = null;
        
        try {
          // Get the Table ID from the registry
          const registryObj = await suiClient.getObject({
            id: TIP_BALANCE_REGISTRY,
            options: { showContent: true },
          });

          const registryContent = registryObj.data?.content as any;
          const tableId = registryContent?.fields?.balances?.fields?.id?.id;

          if (tableId) {
            const dynamicField = await suiClient.getDynamicFieldObject({
              parentId: tableId,
              name: {
                type: "address",
                value: recipientAddress,
              },
            });

            if (dynamicField.data) {
              recipientBalanceId = (dynamicField.data.content as any)?.fields?.value;
            }
          }
        } catch (fieldErr) {
          console.log("Recipient doesn't have a TipBalance yet");
        }

        // If recipient doesn't have a balance, create one for them
        if (!recipientBalanceId) {
          console.log("Creating TipBalance for recipient:", recipientAddress);
          
          const createTx = new Transaction();
          createTx.moveCall({
            target: `${PACKAGE_ID}::tipping::create_tip_balance_for`,
            arguments: [
              createTx.object(TIP_BALANCE_REGISTRY),
              createTx.pure.address(recipientAddress),
            ],
          });

          const { digest: createDigest } = await signAndExecute({ transaction: createTx });
          await suiClient.waitForTransaction({ digest: createDigest });

          // Now fetch the newly created balance ID
          const updatedRegistryObj = await suiClient.getObject({
            id: TIP_BALANCE_REGISTRY,
            options: { showContent: true },
          });

          const updatedContent = updatedRegistryObj.data?.content as any;
          const updatedTableId = updatedContent?.fields?.balances?.fields?.id?.id;

          if (updatedTableId) {
            const updatedField = await suiClient.getDynamicFieldObject({
              parentId: updatedTableId,
              name: {
                type: "address",
                value: recipientAddress,
              },
            });

            if (updatedField.data) {
              recipientBalanceId = (updatedField.data.content as any)?.fields?.value;
            }
          }

          if (!recipientBalanceId) {
            throw new Error("Failed to create recipient's tip balance");
          }
        }
        
        console.log("Recipient balance ID:", recipientBalanceId);

        const tx = new Transaction();

        // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
        const amountInMist = Math.floor(amount * 1_000_000_000);

        // Split coin for payment
        const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

        tx.moveCall({
          target: `${PACKAGE_ID}::tipping::tip_suit`,
          arguments: [
            tx.object(suitId),
            tx.object(recipientBalanceId),
            coin,
            tx.object("0x6"), // Clock
          ],
        });

        const { digest } = await signAndExecute({ transaction: tx });
        await suiClient.waitForTransaction({ digest });

        return { digest, amount };
      } catch (err: any) {
        const errorMsg = err?.message ?? "Failed to send tip";
        setError(errorMsg);
        console.error("Tip error:", err);
        return null;
      } finally {
        setIsTipping(false);
      }
    },
    [address, signAndExecute, suiClient, getOrCreateTipBalance]
  );

  // Get tip balance info
  const getTipBalanceInfo = useCallback(
    async (userAddress: string) => {
      try {
        // Get the balance ID from registry
        const balanceId = await getOrCreateTipBalance(userAddress);
        
        if (!balanceId) {
          return {
            balance: 0,
            totalReceived: 0,
            totalWithdrawn: 0,
            balanceId: null,
          };
        }

        // Fetch the TipBalance object
        const tipBalanceObj = await suiClient.getObject({
          id: balanceId,
          options: { showContent: true },
        });

        const content = tipBalanceObj.data?.content as any;
        const fields = content?.fields;

        if (!fields) {
          return {
            balance: 0,
            totalReceived: 0,
            totalWithdrawn: 0,
            balanceId,
          };
        }

        // Convert MIST to SUI
        const balance = Number(fields.balance) / 1_000_000_000;
        const totalReceived = Number(fields.total_received) / 1_000_000_000;
        const totalWithdrawn = Number(fields.total_withdrawn) / 1_000_000_000;

        return {
          balance,
          totalReceived,
          totalWithdrawn,
          balanceId,
        };
      } catch (err) {
        console.error("Error fetching tip balance:", err);
        return {
          balance: 0,
          totalReceived: 0,
          totalWithdrawn: 0,
          balanceId: null,
        };
      }
    },
    [suiClient, getOrCreateTipBalance]
  );

  // Withdraw funds
  const withdrawFunds = useCallback(
    async (amount: number) => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      if (amount <= 0) {
        setError("Invalid withdrawal amount");
        return null;
      }

      setIsWithdrawing(true);
      setError(null);

      try {
        // Get user's tip balance
        const balanceInfo = await getTipBalanceInfo(address);
        if (!balanceInfo.balanceId) {
          throw new Error("No tip balance found");
        }

        if (amount > balanceInfo.balance) {
          throw new Error("Insufficient balance");
        }

        const tx = new Transaction();

        // Convert SUI to MIST
        const amountInMist = Math.floor(amount * 1_000_000_000);

        tx.moveCall({
          target: `${PACKAGE_ID}::tipping::withdraw_funds`,
          arguments: [
            tx.object(balanceInfo.balanceId),
            tx.pure.u64(amountInMist),
            tx.object("0x6"), // Clock
          ],
        });

        const { digest } = await signAndExecute({ transaction: tx });
        await suiClient.waitForTransaction({ digest });

        return { digest, amount };
      } catch (err: any) {
        const errorMsg = err?.message ?? "Failed to withdraw funds";
        setError(errorMsg);
        console.error("Withdrawal error:", err);
        return null;
      } finally {
        setIsWithdrawing(false);
      }
    },
    [address, signAndExecute, suiClient, getTipBalanceInfo]
  );

  // Initialize your own tip balance
  const initializeMyTipBalance = useCallback(
    async () => {
      if (!address) {
        setError("Wallet not connected");
        return null;
      }

      try {
        // Check if already exists
        try {
          // Get the Table ID from the registry
          const registryObj = await suiClient.getObject({
            id: TIP_BALANCE_REGISTRY,
            options: { showContent: true },
          });

          const registryContent = registryObj.data?.content as any;
          const tableId = registryContent?.fields?.balances?.fields?.id?.id;

          if (tableId) {
            const dynamicField = await suiClient.getDynamicFieldObject({
              parentId: tableId,
              name: {
                type: "address",
                value: address,
              },
            });

            if (dynamicField.data) {
              const balanceId = (dynamicField.data.content as any)?.fields?.value;
              if (balanceId) {
                console.log("TipBalance already exists:", balanceId);
                return { balanceId, alreadyExists: true };
              }
            }
          }
        } catch (err) {
          // Doesn't exist, will create
        }

        // Create TipBalance
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::tipping::create_tip_balance`,
          arguments: [tx.object(TIP_BALANCE_REGISTRY)],
        });

        const { digest } = await signAndExecute({ transaction: tx });
        await suiClient.waitForTransaction({ digest });

        // Query the registry's Table to get the TipBalance ID
        const registryObj = await suiClient.getObject({
          id: TIP_BALANCE_REGISTRY,
          options: { showContent: true },
        });

        const registryContent = registryObj.data?.content as any;
        const tableId = registryContent?.fields?.balances?.fields?.id?.id;

        if (tableId) {
          const dynamicField = await suiClient.getDynamicFieldObject({
            parentId: tableId,
            name: {
              type: "address",
              value: address,
            },
          });

          if (dynamicField.data) {
            const balanceId = (dynamicField.data.content as any)?.fields?.value;
            if (balanceId) {
              return { balanceId, alreadyExists: false };
            }
          }
        }

        return null;
      } catch (err: any) {
        console.error("Error initializing tip balance:", err);
        setError(err.message);
        return null;
      }
    },
    [address, suiClient, signAndExecute]
  );

  return {
    tipSuit,
    getTipBalanceInfo,
    withdrawFunds,
    initializeMyTipBalance,
    isTipping,
    isWithdrawing,
    isCreatingBalance,
    error,
  };
}
