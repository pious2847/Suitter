import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";

interface VideoPost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  authorAddress?: string;
  content: string;
  videoUrl: string;
  timestamp: number;
  likes: number;
  replies: number;
  reposts: number;
  liked: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
}

interface FeedVerticalProps {
  videos: VideoPost[];
  bookmarks: Set<string>;
  onLike: (id: string) => void;
  onRepost?: (id: string) => void;
  onReply?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark: (id: string, isBookmarked: boolean) => void;
  isLoading?: boolean;
}

export function FeedVertical({
  videos,
  bookmarks,
  onLike,
  onReply,
  onShare,
  onBookmark,
  isLoading = false,
}: FeedVerticalProps) {

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white text-center p-8">
        <div className="text-6xl mb-4">🎥</div>
        <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
        <p className="text-gray-400 max-w-sm">
          Be the first to share a video on Suitter!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background w-full overflow-hidden">
      {/* Vertical Snap Scroll Container */}
      <div
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        {videos.map((video, _index) => (
          <div
            key={video.id}
            className="snap-center h-full w-full shrink-0 flex items-center justify-center relative bg-black overflow-hidden"
          >
            {/* Video Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={video.videoUrl}
                className="w-full h-full object-contain"
                autoPlay
                loop
                playsInline
              />

              {/* Video Overlay - Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                    {video.avatar && video.avatar.startsWith("http") ? (
                      <img
                        src={video.avatar}
                        alt={video.author}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{video.avatar}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{video.author}</div>
                    <div className="text-xs text-gray-300">@{video.handle}</div>
                  </div>
                </div>
                <p className="text-sm text-white break-words">
                  {video.content}
                </p>
              </div>

              {/* Right Side Interaction Icons */}
              <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-10">
                {/* Like Button */}
                <button
                  onClick={() => onLike(video.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors backdrop-blur">
                    <Heart
                      size={20}
                      fill={video.liked ? "#fff" : "none"}
                      color="#fff"
                    />
                  </div>
                  <span className="text-white text-xs font-semibold">
                    {video.likes}
                  </span>
                </button>

                {/* Reply Button */}
                <button
                  onClick={() => onReply?.(video.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors backdrop-blur">
                    <MessageCircle size={20} color="#fff" />
                  </div>
                  <span className="text-white text-xs font-semibold">
                    {video.replies}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => onShare?.(video.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors backdrop-blur">
                    <Share size={20} color="#fff" />
                  </div>
                  <span className="text-white text-xs font-semibold">
                    {video.reposts}
                  </span>
                </button>

                {/* Bookmark Button */}
                <button
                  onClick={() => onBookmark(video.id, !bookmarks.has(video.id))}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors backdrop-blur">
                    <Bookmark
                      size={20}
                      fill={bookmarks.has(video.id) ? "#fff" : "none"}
                      color="#fff"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
