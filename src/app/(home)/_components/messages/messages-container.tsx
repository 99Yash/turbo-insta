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

  const handleSendMessage = () => {
    // TODO: Implement message sending
    console.log("Send message");
  };

  return (
    <div className="flex h-full min-h-screen">
      <ConversationsSidebar
        onConversationSelect={handleConversationSelect}
        selectedConversationId={selectedConversation?.id}
      />
      <ChatArea
        conversation={selectedConversation}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
