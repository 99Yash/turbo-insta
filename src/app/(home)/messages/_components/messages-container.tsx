"use client";

import * as React from "react";
import { ConversationsList } from "./conversations-list";
import { MessagesView } from "./messages-view";

export function MessagesContainer() {
  const [selectedConversationId, setSelectedConversationId] =
    React.useState<string>();

  const handleConversationSelect = React.useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
    },
    [],
  );

  return (
    <div className="flex h-full min-h-screen bg-background">
      <div className="flex w-full">
        {/* Conversations List */}
        <div className="w-1/3">
          <ConversationsList
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* Messages View */}
        <div className="flex-1">
          {selectedConversationId ? (
            <MessagesView conversationId={selectedConversationId} />
          ) : (
            <div className="flex h-full items-center justify-center bg-background">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-foreground">
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-light">Your messages</h2>
                <p className="mb-6 max-w-xs text-muted-foreground">
                  Send private photos and messages to a friend or group.
                </p>
                <button className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  Send message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
