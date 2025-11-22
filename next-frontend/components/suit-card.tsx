import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  DollarSign,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { OwnershipHistoryModal } from "./ownership-history-modal";
import { BidModal } from "./bid-modal";
import { TipModal } from "./tip-modal";
import { Link } from "react-router-dom";
import { toast } from "../hooks/use-toast";

interface SuitCardProps {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  authorAddress?: string;
  content: string;
  timestamp: number;
  likes: number;
  replies: number;
  reposts: number;
  liked: boolean;
  reposted?: boolean;
  isNFT?: boolean;
  nftValue?: number;
  currentBid?: number;
  isEncrypted?: boolean;
  tipTotal?: number;
  media?: {
    type: "image" | "video";
    url: string;
  };
  onLike: (id: string) => void;
  onRepost?: (id: string) => void;
  onReply?: (id: string) => void;
  onViewComments?: (id: string) => void;
  onShare?: (id: string) => void;
  onTip?: (id: string, amount: number) => Promise<void>;
}

export function SuitCard({
  id,
  author,
  handle,
  avatar,
  authorAddress,
  content,
  timestamp,
  likes,
  replies,
  reposts,
  liked,
  reposted = false,
  isNFT = true,
  nftValue = 0.5,
  currentBid = 0.75,
  isEncrypted = false,
  tipTotal = 0,
  media,
  onLike,
  onRepost,
  onReply,
  onViewComments,
  onShare,
  onTip,
}: SuitCardProps) {
  const [showBidMenu, setShowBidMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [isTipping, setIsTipping] = useState(false);

  const handleTip = async (amount: number) => {
    if (!onTip) return;
    setIsTipping(true);
    try {
      await onTip(id, amount);
    } finally {
      setIsTipping(false);
    }
  };

  const ownershipHistory = [
    {
      owner: author,
      handle: handle,
      avatar: avatar,
      amount: currentBid,
      type: "bid" as const,
      date: Date.now() - 1 * 60 * 60 * 1000,
    },
    {
      owner: "Sui Developer",
      handle: "sui_dev",
      avatar: "S",
      amount: nftValue,
      type: "purchase" as const,
      date: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      owner: "Creator",
      handle: "creator",
      avatar: "C",
      amount: 0,
      type: "mint" as const,
      date: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
  ];

  const handlePlaceBid = (amount: number) => {
    console.log("[v0] Bid placed:", amount, "SUI for suit", id);
    setShowBidMenu(false);
  };

  return (
    <>
      <article className="border-b border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer group relative">
        <div className="flex gap-4 flex-col">
          <div className="flex-1 min-w-0">
            {/* Header with Author Info and Three-Dot Menu */}
            <div className="flex items-center justify-between">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                  {avatar && avatar.startsWith("http") ? (
                    <img
                      src={avatar}
                      alt={author}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{avatar}</span>
                  )}
                </div>
                <div className="flex text-sm flex-wrap gap-10 items-start">
                  <div className="flex flex-col gap-1">
                    <Link to={`/profile?address=${authorAddress}`} className="font-semibold text-foreground hover:underline">
                      {author}
                    </Link>
                    <Link to={`/profile?address=${authorAddress}`} className="text-muted-foreground hover:underline">
                      @{handle}
                    </Link>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground hover:underline">
                      {formatTime(timestamp)}
                    </span>
                    {isNFT && (
                      <span
                        className={`ml-2 text-xs font-semibold px-2 py-1 rounded-full ${
                          isEncrypted
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {isEncrypted ? "🔐 NFT" : "📦 Suit"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowBidMenu(!showBidMenu)}
                  className="p-2 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="More options"
                >
                  <MoreHorizontal size={16} className="text-muted-foreground" />
                </button>

                {showBidMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-xl shadow-lg z-10 p-3 space-y-2">
                    {isNFT && (
                      <>
                        <div className="pb-3 border-b border-border">
                          <div className="text-xs text-muted-foreground mb-1">
                            Suit Value
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {nftValue} SUI
                          </div>
                          {currentBid > nftValue && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Current bid: {currentBid} SUI
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setShowBidMenu(false);
                            setShowBidModal(true);
                          }}
                          className="w-full py-2 px-3 bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                        >
                          Place Bid
                        </button>
                        <button
                          onClick={() => {
                            setShowBidMenu(false);
                            setShowHistory(true);
                          }}
                          className="w-full py-2 px-3 border border-border rounded-lg font-semibold hover:bg-muted/30 transition-colors text-sm"
                        >
                          View History
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <p className="mt-2 text-base text-foreground wrap-break-word">
            {content}
          </p>

          {/* Media */}
          {media && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border">
              {media.type === "image" ? (
                <img
                  src={media.url}
                  alt="Post media"
                  className="w-full max-h-[500px] object-cover"
                />
              ) : (
                <video
                  src={media.url}
                  controls
                  className="w-full max-h-[500px] object-contain bg-black"
                />
              )}
            </div>
          )}

          {/* Action Buttons with Icons and Counts */}
          <div className="mt-3 flex justify-between text-muted-foreground max-w-md">
            {/* Comment Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onViewComments) {
                  onViewComments(id);
                } else {
                  onReply?.(id);
                }
              }}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn"
              title="Reply"
              aria-label="Reply to post"
            >
              <MessageCircle size={18} />
              {replies > 0 && <span className="text-xs">{replies}</span>}
            </button>

            {/* Repost Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRepost) {
                  onRepost(id);
                  if (!reposted) {
                    toast({
                      title: "Reposted!",
                      description: "Post has been reposted to your profile",
                      variant: "success",
                    });
                  }
                }
              }}
              className={`flex items-center gap-2 p-2 rounded-full transition-colors group/btn ${
                reposted
                  ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                  : "hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400"
              }`}
              title={reposted ? "Unrepost" : "Repost"}
              aria-label={reposted ? "Unrepost" : "Repost"}
            >
              <Repeat2 size={18} />
              {reposts > 0 && <span className="text-xs">{reposts}</span>}
            </button>

            {/* Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(id);
              }}
              className={`flex items-center gap-2 p-2 rounded-full transition-colors group/btn ${
                liked
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  : "hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400"
              }`}
              title={liked ? "Unlike" : "Like"}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              {likes > 0 && <span className="text-xs">{likes}</span>}
            </button>

            {/* Tip Button */}
            {onTip && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTipModal(true);
                }}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400 transition-colors group/btn"
                title="Send tip"
                aria-label="Send tip"
              >
                <DollarSign size={18} />
                {tipTotal > 0 && (
                  <span className="text-xs font-semibold">{tipTotal.toFixed(2)}</span>
                )}
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onShare) {
                  onShare(id);
                } else {
                  // Copy link to clipboard
                  navigator.clipboard.writeText(window.location.origin + `/post/${id}`);
                  toast({
                    title: "Link Copied!",
                    description: "Post link copied to clipboard",
                    variant: "success",
                  });
                }
              }}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn"
              title="Share"
              aria-label="Share post"
            >
              <Share size={18} />
            </button>
          </div>
        </div>
      </article>

      <OwnershipHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        suitId={id}
        suitName={content}
        history={ownershipHistory}
      />

      <BidModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        suitId={id}
        suitName={content}
        currentValue={nftValue || 0.5}
        currentBid={currentBid || 0.75}
        onPlaceBid={handlePlaceBid}
      />

      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        onTip={handleTip}
        recipientName={author}
        isLoading={isTipping}
      />
    </>
  );
}
