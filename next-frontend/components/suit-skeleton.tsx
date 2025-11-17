export function SuitSkeleton() {
  return (
    <article className="border-b border-border p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
        
        <div className="flex-1 space-y-3">
          {/* Author info skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
          
          {/* Media skeleton (optional) */}
          <div className="h-64 bg-muted rounded-2xl w-full" />
          
          {/* Actions skeleton */}
          <div className="flex justify-between max-w-xs pt-2">
            <div className="h-8 w-8 bg-muted rounded-full" />
            <div className="h-8 w-8 bg-muted rounded-full" />
            <div className="h-8 w-8 bg-muted rounded-full" />
            <div className="h-8 w-8 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SuitSkeleton key={i} />
      ))}
    </>
  );
}
