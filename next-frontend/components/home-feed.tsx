import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSuits } from "../hooks/useSuits";
import { useInteractions } from "../hooks/useInteractions";
import { useProfile } from "../hooks/useProfile";
import { SuitCard } from "./suit-card";
import { FeedVertical } from "./feed-vertical";
import { ReplyModal } from "./reply-modal";
import { CommentsView } from "./comments-view";
import { FeedSkeleton } from "./suit-skeleton";
import { truncateAddress } from "@/lib/utils";

interface Suit {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  timestamp: number;
  likes: number;
  replies: number;
  reposts: number;
  liked: boolean;
  reposted?: boolean;
  isNFT: boolean;
  nftValue: number;
  currentBid: number;
  isEncrypted: boolean;
  media?: {
    type: "image" | "video";
    url: string;
  };
}

interface HomeFeedProps {
  onCompose: () => void;
}

export function HomeFeed({ onCompose }: HomeFeedProps) {
  const account = useCurrentAccount();
  const address = account?.address ?? null;
  const { fetchSuits, fetchVideoFeed } = useSuits();
  const {
    likeSuit,
    retweetSuit,
    commentOnSuit,
  } = useInteractions();
  const { fetchProfileByAddress } = useProfile();
  const [suits, setSuits] = useState<Suit[]>([]);
  const [tab, setTab] = useState<"foryou" | "following" | "feed">("foryou");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyToSuit, setReplyToSuit] = useState<Suit | null>(null);
  const [commentsViewOpen, setCommentsViewOpen] = useState(false);
  const [commentsForSuit, setCommentsForSuit] = useState<Suit | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch on-chain suits on mount
  useEffect(() => {
    const loadSuits = async () => {
      // Fetch all suits or video suits based on tab
      const fetchedSuits = tab === "feed" 
        ? await fetchVideoFeed(20, 0)
        : await fetchSuits(20, 0);

      // Transform on-chain suits to component format
      const transformedPromises = fetchedSuits.map(async (suit: any) => {
        const fields = suit?.content?.fields;
        if (!fields) return null;

        const creatorAddress = fields.creator || "";
        let displayName = truncateAddress(creatorAddress || "Unknown");
        let handleName = truncateAddress(creatorAddress || "unknown", 4, 4);

        // Fetch profile for the creator
        let avatarUrl = creatorAddress?.slice(-2).toUpperCase() || "??";
        if (creatorAddress) {
          const profile = await fetchProfileByAddress(creatorAddress);
          if (profile) {
            if (profile.username) {
              displayName = profile.username;
              handleName = profile.username;
            }
            if (profile.pfpUrl) {
              avatarUrl = profile.pfpUrl;
            }
          }
        }

        return {
          id: suit.objectId,
          author: displayName,
          handle: handleName,
          avatar: avatarUrl,
          content: fields.content || "",
          timestamp: parseInt(fields.created_at) || Date.now(),
          likes: parseInt(fields.like_count) || 0,
          replies: parseInt(fields.comment_count) || 0,
          reposts: parseInt(fields.retweet_count) || 0,
          liked: false,
          reposted: false,
          isNFT: true,
          nftValue: 0,
          currentBid: 0,
          isEncrypted: false,
          media:
            fields.media_urls?.length > 0
              ? {
                  type: "image" as const,
                  url: fields.media_urls[0],
                }
              : undefined,
        };
      });

      const transformed = (await Promise.all(transformedPromises)).filter(
        Boolean
      ) as Suit[];

      setSuits(transformed);
      setIsInitialLoad(false);
    };

    loadSuits();

    const intervalId = setInterval(() => {
      loadSuits();
    }, 5000); // Refresh every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchSuits, fetchVideoFeed, fetchProfileByAddress, tab]);

  // Get current suits
  const currentSuits = suits;

  const toggleLike = async (id: string) => {
    if (!address) {
      console.log("Please connect wallet to like");
      return;
    }

    const suit = currentSuits.find((s) => s.id === id);
    if (!suit) return;
    const isOnChain = id.startsWith("0x");

    // Optimistically update UI
    const updateSuit = (suits: Suit[]) =>
      suits.map((s) =>
        s.id === id
          ? {
              ...s,
              liked: !s.liked,
              likes: s.liked ? s.likes - 1 : s.likes + 1,
            }
          : s
      );

    setSuits(updateSuit(suits));

    // Only call blockchain for on-chain suits
    if (isOnChain) {
      try {
        await likeSuit(id);
        console.log("Suit liked successfully!");
      } catch (error: any) {
        console.error("Failed to like suit:", error);
        // Revert optimistic update on error
        const revertSuit = (suits: Suit[]) =>
          suits.map((s) =>
            s.id === id
              ? {
                  ...s,
                  liked: suit.liked,
                  likes: suit.likes,
                }
              : s
          );

        setSuits(revertSuit(suits));
      }
    }
  };

  const toggleRepost = async (id: string) => {
    if (!address) {
      console.log("Please connect wallet to retweet");
      return;
    }

    const suit = currentSuits.find((s) => s.id === id);
    if (!suit) return;
    const isOnChain = id.startsWith("0x");

    // Optimistically update UI
    const updateSuit = (suits: Suit[]) =>
      suits.map((s) =>
        s.id === id
          ? {
              ...s,
              reposted: !s.reposted,
              reposts: s.reposted ? s.reposts - 1 : s.reposts + 1,
            }
          : s
      );

    setSuits(updateSuit(suits));

    // Only call blockchain for on-chain suits
    if (isOnChain) {
      try {
        await retweetSuit(id);
        console.log("Suit retweeted successfully!");
      } catch (error: any) {
        console.error("Failed to retweet suit:", error);
        // Revert optimistic update on error
        const revertSuit = (suits: Suit[]) =>
          suits.map((s) =>
            s.id === id
              ? {
                  ...s,
                  reposted: suit.reposted,
                  reposts: suit.reposts,
                }
              : s
          );

        setSuits(revertSuit(suits));
      }
    }
  };

  const handleReply = (id: string) => {
    const suit = currentSuits.find((s) => s.id === id);
    if (suit) {
      setReplyToSuit(suit);
      setReplyModalOpen(true);
    }
  };

  const handleViewComments = (id: string) => {
    const suit = currentSuits.find((s) => s.id === id);
    if (suit) {
      setCommentsForSuit(suit);
      setCommentsViewOpen(true);
    }
  };

  const handleReplySubmit = async (suitId: string, replyContent: string) => {
    if (!address) {
      console.log("Please connect wallet to comment");
      return;
    }

    try {
      const isOnChain = suitId.startsWith("0x");
      // Submit comment to blockchain only for on-chain suits
      if (isOnChain) {
        await commentOnSuit(suitId, replyContent);
        console.log("Comment submitted successfully!");
      }

      // Increment the reply count
      const updateReplies = (suits: Suit[]) =>
        suits.map((suit) =>
          suit.id === suitId ? { ...suit, replies: suit.replies + 1 } : suit
        );

      setSuits(updateReplies(suits));
    } catch (error: any) {
      console.error("Failed to comment on suit:", error);
    }
  };

  const handleShare = (id: string) => {
    const suit = currentSuits.find((s) => s.id === id);
    if (suit && navigator.share) {
      navigator
        .share({
          title: `${suit.author} on Suiter`,
          text: suit.content,
          url: window.location.href,
        })
        .catch((err) => console.log("Error sharing:", err));
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      console.log("Link copied to clipboard");
      // TODO: Show toast notification
    }
  };

  const toggleBookmark = (id: string, isBookmarked: boolean) => {
    const newBookmarks = new Set(bookmarks);
    if (isBookmarked) {
      newBookmarks.add(id);
    } else {
      newBookmarks.delete(id);
    }
    setBookmarks(newBookmarks);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border z-10">
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("foryou")}
            className={`flex-1 px-4 py-4 font-semibold text-sm transition-colors relative hover:bg-muted/50 ${
              tab === "foryou" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            For You
            {tab === "foryou" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
            )}
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 px-4 py-4 font-semibold text-sm transition-colors relative hover:bg-muted/50 ${
              tab === "following" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Following
            {tab === "following" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
            )}
          </button>
          <button
            onClick={() => setTab("feed")}
            className={`flex-1 px-4 py-4 font-semibold text-sm transition-colors relative hover:bg-muted/50 ${
              tab === "feed" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Feed
            {tab === "feed" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
            )}
          </button>
        </div>
      </div>

      {/* Compose Section */}
      {address && tab !== "feed" && (
        <div className="border-b border-border p-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-sm font-mono font-bold shrink-0">
              {address.slice(-4).toUpperCase()}
            </div>
            <div className="flex-1">
              <button
                onClick={onCompose}
                className="w-full text-left text-lg text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/30"
              >
                What's happening!?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Content Based on Tab */}
      <div className="flex-1 overflow-y-auto">
        {tab === "feed" ? (
          <FeedVertical />
        ) : isInitialLoad ? (
          <FeedSkeleton count={5} />
        ) : currentSuits.length > 0 ? (
          <>
            {currentSuits.map((suit) => (
              <SuitCard
                key={suit.id}
                {...suit}
                media={suit.media}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onReply={handleReply}
                onViewComments={handleViewComments}
                onShare={handleShare}
                onBookmark={toggleBookmark}
                bookmarked={bookmarks.has(suit.id)}
              />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-foreground text-xl font-bold mb-2">
              No posts yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              Be the first to share something! Click the compose button to create your first post.
            </p>
            {address && (
              <button
                onClick={onCompose}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-bold"
              >
                Create Post
              </button>
            )}
          </div>
        )}
      </div>

      {replyToSuit && (
        <ReplyModal
          isOpen={replyModalOpen}
          onClose={() => {
            setReplyModalOpen(false);
            setReplyToSuit(null);
          }}
          originalSuit={{
            id: replyToSuit.id,
            author: replyToSuit.author,
            handle: replyToSuit.handle,
            avatar: replyToSuit.avatar,
            content: replyToSuit.content,
          }}
          onReplySubmit={handleReplySubmit}
        />
      )}

      {commentsForSuit && (
        <CommentsView
          isOpen={commentsViewOpen}
          onClose={() => {
            setCommentsViewOpen(false);
            setCommentsForSuit(null);
          }}
          suitId={commentsForSuit.id}
          suitContent={commentsForSuit.content}
          suitAuthor={commentsForSuit.author}
          suitHandle={commentsForSuit.handle}
          suitAvatar={commentsForSuit.avatar}
        />
      )}
    </div>
  );
}
