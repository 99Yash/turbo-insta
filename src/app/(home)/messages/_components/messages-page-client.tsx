"use client";

import { useRouter } from "next/navigation";
import type { ConversationWithParticipants } from "~/server/api/services/messages.service";
import { api } from "~/trpc/react";
import { ChatArea } from "../../_components/messages/chat-area";
import { ConversationsSidebar } from "../../_components/messages/conversations-sidebar";

export function MessagesPageClient() {
  const router = useRouter();
  const utils = api.useUtils();

  const createConversationMutation =
    api.messages.getOrCreateConversation.useMutation({
      onSuccess: (conversation) => {
        // Invalidate and refetch conversations to ensure the new conversation appears
        void utils.messages.getConversations.invalidate();
        router.push(`/messages/${conversation.id}`);
      },
    });

  const handleConversationSelect = (
    conversation: ConversationWithParticipants,
  ) => {
    router.push(`/messages/${conversation.id}`);
  };

  const handleUserSelect = (userId: string) => {
    createConversationMutation.mutate({
      otherUserId: userId,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Show sidebar - full width on mobile */}
      <ConversationsSidebar onConversationSelect={handleConversationSelect} />

      {/* Show empty state when no conversation selected - hidden on mobile */}
      <div className="hidden flex-1 lg:flex">
        <ChatArea onUserSelect={handleUserSelect} />
      </div>
    </div>
  );
}
