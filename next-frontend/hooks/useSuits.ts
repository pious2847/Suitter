import { useCallback, useMemo, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import CONFIG from "../config";

const PACKAGE_ID = CONFIG.VITE_PACKAGE_ID;
const SUIT_REGISTRY_ID = CONFIG.SUIT_REGISTRY;

export function useSuits() {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [isPosting, setIsPosting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = account?.address ?? null;

  const fetchSuits = useCallback(
    async (limit: number = 20, offset: number = 0) => {
      setIsFetching(true);
      setError(null);
      try {
        // Get the SuitRegistry to fetch suit IDs
        const registry = await suiClient.getObject({
          id: SUIT_REGISTRY_ID,
          options: { showContent: true },
        });

        const registryContent = registry.data?.content as any;
        const suitIds = registryContent?.fields?.suit_ids || [];

        // Get recent suits (reverse order for newest first)
        const recentSuitIds = suitIds
          .slice(-limit - offset)
          .reverse()
          .slice(offset, offset + limit);

        // Fetch all suit objects
        const suits = await Promise.all(
          recentSuitIds.map(async (id: string) => {
            try {
              const suit = await suiClient.getObject({
                id,
                options: { showContent: true, showOwner: true },
              });
              return suit.data;
            } catch (e) {
              console.error(`Failed to fetch suit ${id}:`, e);
              return null;
            }
          })
        );

        return suits.filter(Boolean);
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch suits");
        console.error("Failed to fetch suits:", e);
        return [];
      } finally {
        setIsFetching(false);
      }
    },
    [suiClient]
  );

  const postSuit = useCallback(
    async (content: string, mediaUrls?: string[], contentType: 'text' | 'image' | 'video' = 'text') => {
      if (!address) throw new Error("Wallet not connected");
      if (!PACKAGE_ID || PACKAGE_ID === "0x...") {
        throw new Error("VITE_PACKAGE_ID not configured");
      }
      setIsPosting(true);
      setError(null);
      try {
        const tx = new Transaction();

        tx.moveCall({
          target: `${PACKAGE_ID}::suits::create_suit`,
          arguments: [
            tx.object(SUIT_REGISTRY_ID), // &mut SuitRegistry
            tx.pure.string(content), // vector<u8> content
            tx.pure(
              bcs
                .vector(bcs.vector(bcs.u8()))
                .serialize(
                  (mediaUrls || []).map((url) =>
                    Array.from(new TextEncoder().encode(url))
                  )
                )
            ), // vector<vector<u8>> media URLs
            tx.pure.string(contentType), // vector<u8> content_type
            tx.object("0x6"), // Clock object
          ],
        });

        const { digest } = await signAndExecute({ transaction: tx });
        await suiClient.waitForTransaction({ digest });
        return digest;
      } catch (e: any) {
        setError(e?.message ?? "Failed to post suit");
        throw e;
      } finally {
        setIsPosting(false);
      }
    },
    [address, signAndExecute, suiClient]
  );

  const fetchVideoFeed = useCallback(
    async (limit: number = 20, offset: number = 0) => {
      setIsFetching(true);
      setError(null);
      try {
        const allSuits = await fetchSuits(limit * 2, offset); // Fetch more to filter
        
        // Filter for video content only
        const videoSuits = allSuits.filter((suit: any) => {
          const fields = suit?.content?.fields;
          if (!fields) return false;
          
          // Check content_type field
          if (fields.content_type === 'video') return true;
          
          // Fallback: check media URLs for video extensions
          if (fields.media_urls?.length > 0) {
            const url = fields.media_urls[0].toLowerCase();
            return url.includes('.mp4') || 
                   url.includes('.webm') || 
                   url.includes('.mov') ||
                   url.includes('video');
          }
          
          return false;
        });
        
        return videoSuits.slice(0, limit);
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch video feed");
        console.error("Failed to fetch video feed:", e);
        return [];
      } finally {
        setIsFetching(false);
      }
    },
    [fetchSuits]
  );

  const fetchImageFeed = useCallback(
    async (limit: number = 20, offset: number = 0) => {
      setIsFetching(true);
      setError(null);
      try {
        const allSuits = await fetchSuits(limit * 2, offset); // Fetch more to filter
        
        // Filter for image content only
        const imageSuits = allSuits.filter((suit: any) => {
          const fields = suit?.content?.fields;
          if (!fields) return false;
          
          // Check content_type field
          if (fields.content_type === 'image') return true;
          
          // Fallback: check media URLs for image extensions
          if (fields.media_urls?.length > 0) {
            const url = fields.media_urls[0].toLowerCase();
            return url.includes('.jpg') || 
                   url.includes('.jpeg') || 
                   url.includes('.png') ||
                   url.includes('.gif') ||
                   url.includes('.webp') ||
                   url.includes('image');
          }
          
          return false;
        });
        
        return imageSuits.slice(0, limit);
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch image feed");
        console.error("Failed to fetch image feed:", e);
        return [];
      } finally {
        setIsFetching(false);
      }
    },
    [fetchSuits]
  );

  const fetchSuitsByContentType = useCallback(
    async (contentType: 'text' | 'image' | 'video', limit: number = 20, offset: number = 0) => {
      if (contentType === 'video') return fetchVideoFeed(limit, offset);
      if (contentType === 'image') return fetchImageFeed(limit, offset);
      return fetchSuits(limit, offset);
    },
    [fetchSuits, fetchVideoFeed, fetchImageFeed]
  );

  return useMemo(
    () => ({ 
      address, 
      isPosting, 
      isFetching, 
      error, 
      postSuit, 
      fetchSuits,
      fetchVideoFeed,
      fetchImageFeed,
      fetchSuitsByContentType
    }),
    [address, isPosting, isFetching, error, postSuit, fetchSuits, fetchVideoFeed, fetchImageFeed, fetchSuitsByContentType]
  );
}
