import { Icons } from "~/components/icons";

export default function ConversationLoading() {
  return (
    <div className="flex h-full min-h-screen">
      {/* Skeleton sidebar */}
      <div className="w-80 border-r border-border/40 bg-background">
        <div className="flex h-full flex-col">
          {/* Header skeleton */}
          <div className="border-b border-border/40 p-4">
            <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
          </div>

          {/* Conversations skeleton */}
          <div className="flex-1 space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted"></div>
                <div className="flex-1">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                  <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex flex-1 items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
