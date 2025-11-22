export function SuitCardSkeleton() {
  return (
    <div className="border-b border-border p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
        
        <div className="flex-1 space-y-3">
          {/* Author info skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-12" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex gap-12 mt-3">
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-4 bg-muted rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuitCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SuitCardSkeleton key={i} />
      ))}
    </>
  );
}
