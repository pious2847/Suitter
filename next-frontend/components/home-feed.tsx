import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSuits } from "../hooks/useSuits";
import { useInteractions } from "../hooks/useInteractions";
import { useProfile } from "../hooks/useProfile";
import { useTipping } from "../hooks/useTipping";
import { toast } from "../hooks/use-toast";
import { SuitCard } from "./suit-card";
import { SuitCardSkeletonList } from "./suit-card-skeleton";
import { FeedVertical } from "./feed-vertical";
import { ReplyModal } from "./reply-modal";
import { CommentsView } from "./comments-view";
import { truncateAddress } from "@/lib/utils";

interface Suit {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  authorAddress?: string;
  content: string;
  contentType?: string;
  timestamp: number;
  likes: number;
  replies: number;
  reposts: number;
  tipTotal?: number;
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
  const { fetchSuits } = useSuits();
  const {
    likeSuit,
    retweetSuit,
    commentOnSuit,
  } = useInteractions();
  const { fetchProfileByAddress, fetchMyProfileFields } = useProfile();
  const { tipSuit } = useTipping();
  const [allSuits, setAllSuits] = useState<Suit[]>([]);
  const [videoSuits, setVideoSuits] = useState<Suit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"foryou" | "following" | "feed">("foryou");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyToSuit, setReplyToSuit] = useState<Suit | null>(null);
  const [commentsViewOpen, setCommentsViewOpen] = useState(false);
  const [commentsForSuit, setCommentsForSuit] = useState<Suit | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!address) return;
      const profile = await fetchMyProfileFields();
      setUserProfile(profile);
    };
    loadUserProfile();
  }, [address, fetchMyProfileFields]);

  // Fetch on-chain suits on mount
  useEffect(() => {
    const loadSuits = async () => {
      try {
        const suits = await fetchSuits(20, 0);

        // Transform on-chain suits to component format
        const transformedPromises = suits.map(async (suit: any) => {
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

          // Determine media type from content_type field or URL
          let mediaType: "image" | "video" | undefined = undefined;
          if (fields.media_urls?.length > 0) {
            const contentType = fields.content_type || 'text';
            if (contentType === 'video') {
              mediaType = 'video';
            } else if (contentType === 'image') {
              mediaType = 'image';
            } else {
              // Fallback: detect from URL extension
              const url = fields.media_urls[0].toLowerCase();
              if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('video')) {
                mediaType = 'video';
              } else {
                mediaType = 'image';
              }
            }
          }

          return {
            id: suit.objectId,
            author: displayName,
            handle: handleName,
            avatar: avatarUrl,
            authorAddress: creatorAddress,
            content: fields.content || "",
            contentType: fields.content_type || 'text',
            timestamp: parseInt(fields.created_at) || Date.now(),
            likes: parseInt(fields.like_count) || 0,
            replies: parseInt(fields.comment_count) || 0,
            reposts: parseInt(fields.retweet_count) || 0,
            tipTotal: (parseInt(fields.tip_total) || 0) / 1_000_000_000, // Convert MIST to SUI
            liked: false,
            reposted: false,
            isNFT: true,
            nftValue: 0,
            currentBid: 0,
            isEncrypted: false,
            media:
              fields.media_urls?.length > 0 && mediaType
                ? {
                    type: mediaType,
                    url: fields.media_urls[0],
                  }
                : undefined,
          };
        });

        const transformed = (await Promise.all(transformedPromises)).filter(
          Boolean
        ) as Suit[];

        setAllSuits(transformed);
        
        // Filter video suits for the feed tab
        const videos = transformed.filter(suit => suit.media?.type === 'video');
        setVideoSuits(videos);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load suits:", error);
        setIsLoading(false);
      }
    };

    // Initial load
    loadSuits();

    // Refresh every 5 seconds
    const intervalId = setInterval(() => {
      loadSuits();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchSuits, fetchProfileByAddress]);

  // Get current suits based on active tab
  const currentSuits = tab === "feed" ? videoSuits : allSuits;

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

    setAllSuits(updateSuit(allSuits));
    setVideoSuits(updateSuit(videoSuits));

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

        setAllSuits(revertSuit(allSuits));
        setVideoSuits(revertSuit(videoSuits));
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

    setAllSuits(updateSuit(allSuits));
    setVideoSuits(updateSuit(videoSuits));

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

        setAllSuits(revertSuit(allSuits));
        setVideoSuits(revertSuit(videoSuits));
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

      setAllSuits(updateReplies(allSuits));
      setVideoSuits(updateReplies(videoSuits));
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

  const handleTip = async (suitId: string, amount: number) => {
    if (!address) {
      console.log("Please connect wallet to tip");
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send tips",
        variant: "destructive",
      });
      return;
    }

    const suit = currentSuits.find((s) => s.id === suitId);
    if (!suit || !suit.authorAddress) {
      console.error("Suit or author address not found");
      toast({
        title: "Error",
        description: "Could not find post information",
        variant: "destructive",
      });
      return;
    }

    if (address === suit.authorAddress) {
      toast({
        title: "Cannot Tip Own Post",
        description: "You cannot tip your own post",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Sending tip:", { suitId, recipient: suit.authorAddress, amount });
      const result = await tipSuit(suitId, suit.authorAddress, amount);
      
      if (result) {
        console.log("Tip sent successfully!", result);
        toast({
          title: "Tip Sent!",
          description: `Successfully sent ${amount} SUI tip to ${suit.author}!`,
          variant: "success",
        });
        
        // Optimistically update the tip total
        const updateTip = (suits: Suit[]) =>
          suits.map((s) =>
            s.id === suitId
              ? { ...s, tipTotal: (s.tipTotal || 0) + amount }
              : s
          );

        setAllSuits(updateTip(allSuits));
        setVideoSuits(updateTip(videoSuits));
      } else {
        toast({
          title: "Failed to Send Tip",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to send tip:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send tip",
        variant: "destructive",
      });
    }
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
          {/* <button
            onClick={() => setTab("following")}
            className={`flex-1 px-4 py-4 font-semibold text-sm transition-colors relative hover:bg-muted/50 ${
              tab === "following" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Following
            {tab === "following" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
            )}
          </button> */}
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
      {address && (
        <div className="border-b border-border p-4">
          <button
            onClick={onCompose}
            className="w-full flex gap-4 hover:bg-muted/30 transition-colors rounded-lg p-2 -m-2 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-sm font-mono font-bold shrink-0 overflow-hidden">
              {userProfile?.pfpUrl ? (
                <img
                  src={userProfile.pfpUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {userProfile?.username?.slice(0, 2).toUpperCase() ||
                   address.slice(-2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="text-lg text-muted-foreground group-hover:text-foreground transition-colors">
                What's happening!?
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "feed" ? (
          <FeedVertical
            videos={videoSuits.map((suit) => ({
              id: suit.id,
              author: suit.author,
              handle: suit.handle,
              avatar: suit.avatar,
              authorAddress: suit.authorAddress,
              content: suit.content,
              videoUrl: suit.media?.url || "",
              timestamp: suit.timestamp,
              likes: suit.likes,
              replies: suit.replies,
              reposts: suit.reposts,
              liked: suit.liked,
              reposted: suit.reposted,
              bookmarked: bookmarks.has(suit.id),
            }))}
            bookmarks={bookmarks}
            onLike={toggleLike}
            onRepost={toggleRepost}
            onReply={handleReply}
            onShare={handleShare}
            onBookmark={toggleBookmark}
            isLoading={isLoading}
          />
        ) : isLoading ? (
          <SuitCardSkeletonList count={5} />
        ) : currentSuits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No suits yet
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Be the first to post a suit on the blockchain!
            </p>
            {address && (
              <button
                onClick={onCompose}
                className="mt-4 px-6 py-2 bg-foreground text-background rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                Create Post
              </button>
            )}
          </div>
        ) : (
          <>
            {currentSuits.map((suit) => (
              <SuitCard
                key={suit.id}
                {...suit}
                media={suit.media}
                tipTotal={suit.tipTotal}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onReply={handleReply}
                onViewComments={handleViewComments}
                onShare={handleShare}
                onTip={handleTip}
              />
            ))}
          </>
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
