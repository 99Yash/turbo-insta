"use client";

import { useRouter } from "next/navigation";
import type { ConversationWithParticipants } from "~/server/api/services/messages.service";
import { api } from "~/trpc/react";
import { ChatArea } from "../../_components/messages/chat-area";
import { ConversationsSidebar } from "../../_components/messages/conversations-sidebar";

export function MessagesPageClient() {
  const router = useRouter();

  const createConversationMutation =
    api.messages.getOrCreateConversation.useMutation({
      onSuccess: (conversation) => {
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
    <div className="flex h-full min-h-screen">
      {/* Always show sidebar */}
      <ConversationsSidebar onConversationSelect={handleConversationSelect} />

      {/* Show empty state when no conversation selected */}
      <ChatArea onUserSelect={handleUserSelect} />
    </div>
  );
}
