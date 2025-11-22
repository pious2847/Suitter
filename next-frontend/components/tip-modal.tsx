import { useState } from "react";
import { X, DollarSign } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTip: (amount: number) => Promise<void>;
  recipientName: string;
  isLoading?: boolean;
}

const PRESET_AMOUNTS = [0.01, 0.05, 0.1, 0.5, 1, 5];

export function TipModal({
  isOpen,
  onClose,
  onTip,
  recipientName,
  isLoading = false,
}: TipModalProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleTip = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount < 0.01) {
      setError("Minimum tip is 0.01 SUI");
      return;
    }

    try {
      await onTip(amount);
      handleClose();
    } catch (err) {
      setError("Failed to send tip");
    }
  };

  const handleClose = () => {
    setCustomAmount("");
    setSelectedAmount(null);
    setError("");
    onClose();
  };

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setError("");
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-background rounded-2xl w-full max-w-md border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Send Tip</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Close"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Send a tip to <span className="font-semibold text-foreground">{recipientName}</span>
            </p>
          </div>

          {/* Preset Amounts */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handlePresetClick(amount)}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                    selectedAmount === amount
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {amount} SUI
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label
              htmlFor="custom-amount"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Custom Amount
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DollarSign size={18} />
              </div>
              <input
                id="custom-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
                className="w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-16 py-3 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                SUI
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Minimum: 0.01 SUI
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Summary */}
          {(selectedAmount || customAmount) && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  {selectedAmount || parseFloat(customAmount) || 0} SUI
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Network Fee</span>
                <span>~0.001 SUI</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-border rounded-full font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTip}
            disabled={isLoading || (!selectedAmount && !customAmount)}
            className="flex-1 px-4 py-2 bg-foreground text-background rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Tip"}
          </button>
        </div>
      </div>
    </div>
  );
}
