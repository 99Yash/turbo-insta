"use client";

import { useState } from "react";
import type { ConversationWithParticipants } from "~/server/api/services/messages.service";
import { ChatArea } from "./chat-area";
import { ConversationsSidebar } from "./conversations-sidebar";

export function MessagesContainer() {
  const [selectedConversation, setSelectedConversation] = useState<
    ConversationWithParticipants | undefined
  >();

  const handleConversationSelect = (
    conversation: ConversationWithParticipants,
  ) => {
    setSelectedConversation(conversation);
  };

  const handleUserSelect = (userId: string) => {
    // TODO: Create conversation with user and navigate to it
    console.log("Selected user:", userId);
  };

  const handleBack = () => {
    setSelectedConversation(undefined);
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar - hidden on mobile when conversation is selected */}
      <div
        className={`${selectedConversation ? "hidden lg:flex" : "flex"} lg:flex`}
      >
        <ConversationsSidebar
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversation?.id}
        />
      </div>

      {/* Chat area - hidden on mobile when no conversation is selected */}
      <div
        className={`${selectedConversation ? "flex" : "hidden lg:flex"} flex-1`}
      >
        <ChatArea
          conversation={selectedConversation}
          onUserSelect={handleUserSelect}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
