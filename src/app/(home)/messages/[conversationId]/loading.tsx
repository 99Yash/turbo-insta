import {
  ConversationItemLoading,
  LoadingState,
  MessageLoadingBubble,
} from "~/components/ui/loading";

export default function ConversationLoading() {
  return (
    <div className="flex h-full min-h-screen">
      {/* Responsive Sidebar - Hidden on small screens, shown on md+ */}
      <div className="hidden w-80 border-r border-border/40 bg-background md:flex">
        <div className="flex h-full w-full flex-col">
          {/* Header skeleton with shimmer effect */}
          <div className="border-b border-border/40 p-4">
            <div className="h-6 w-32 rounded bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] motion-safe:animate-shine motion-reduce:animate-none motion-reduce:bg-muted/70"></div>
          </div>

          {/* Enhanced Conversations skeleton with staggered animations */}
          <div className="flex-1 overflow-y-auto">
            {Array.from({ length: 8 }, (_, i) => (
              <ConversationItemLoading
                key={i}
                className="motion-safe:animate-stagger-in motion-reduce:animate-none"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header Loading */}
        <div className="border-b border-border/40 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] motion-safe:animate-shine motion-reduce:animate-none motion-reduce:bg-muted/70"></div>
            <div className="flex-1 space-y-1">
              <div className="h-5 w-32 rounded bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] motion-safe:animate-shine motion-reduce:animate-none motion-reduce:bg-muted/70"></div>
              <div className="h-3 w-20 rounded bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] motion-safe:animate-shine motion-reduce:animate-none motion-reduce:bg-muted/70"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Messages Loading Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Simulate conversation with alternating message bubbles */}
          <MessageLoadingBubble
            isOwn={false}
            className="motion-safe:animate-fade-in-up motion-reduce:animate-none"
            style={{ animationDelay: "100ms" }}
          />
          <MessageLoadingBubble
            isOwn={true}
            className="motion-safe:animate-fade-in-up motion-reduce:animate-none"
            style={{ animationDelay: "300ms" }}
          />
          <MessageLoadingBubble
            isOwn={false}
            className="motion-safe:animate-fade-in-up motion-reduce:animate-none"
            style={{ animationDelay: "500ms" }}
          />
          <MessageLoadingBubble
            isOwn={true}
            className="motion-safe:animate-fade-in-up motion-reduce:animate-none"
            style={{ animationDelay: "700ms" }}
          />

          {/* Loading indicator for incoming message */}
          <div className="flex justify-center py-4">
            <LoadingState
              title="Loading conversation..."
              variant="inline"
              spinnerVariant="dots"
              className="motion-safe:animate-fade-in-up motion-reduce:animate-none"
            />
          </div>
        </div>

        {/* Message Input Loading */}
        <div className="border-t border-border/40 p-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 flex-1 rounded-lg bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] motion-safe:animate-shine motion-reduce:animate-none motion-reduce:bg-muted/70"></div>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] motion-safe:animate-shine motion-reduce:animate-none motion-reduce:bg-muted/70"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
