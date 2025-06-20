"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { ConversationWithParticipants } from "~/server/api/services/messages.service";
import { NewMessageModal } from "./new-message-modal";

interface ChatAreaProps {
  readonly conversation?: ConversationWithParticipants;
  readonly onSendMessage?: () => void;
  readonly onUserSelect?: (userId: string) => void;
}

export function ChatArea({
  conversation,
  onSendMessage,
  onUserSelect,
}: ChatAreaProps) {
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const handleUserSelect = (userId: string) => {
    onUserSelect?.(userId);
  };

  // Empty state when no conversation is selected
  if (!conversation) {
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
            onClick={() => setShowNewMessageModal(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Send message
          </Button>

          {/* TODO: Replace with actual NewMessageModal */}
          {showNewMessageModal && (
            <NewMessageModal
              open={showNewMessageModal}
              onOpenChange={setShowNewMessageModal}
              onUserSelect={handleUserSelect}
            />
          )}
        </div>
      </div>
    );
  }

  // Chat interface when conversation is selected
  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Chat header */}
      <div className="flex items-center border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-green-500"></div>
          <span className="font-medium">
            Chat with {conversation.participant1.username}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4">
        <div className="text-center text-muted-foreground">
          Chat messages will appear here
        </div>
      </div>

      {/* Message input */}
      <div className="border-t border-border/40 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 rounded-full border border-border/40 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            size="sm"
            onClick={onSendMessage}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
