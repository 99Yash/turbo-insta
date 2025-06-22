"use client";

import { Send } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ChatEmptyStateProps {
  readonly onNewMessage: () => void;
}

export function ChatEmptyState({ onNewMessage }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-foreground">
          <Send className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-2xl font-light">Your messages</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Send a message to start a chat.
        </p>
        <Button
          onClick={onNewMessage}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Send message
        </Button>
      </div>
    </div>
  );
}
