"use client";

import { notFound, useRouter } from "next/navigation";
import type { ConversationWithParticipants } from "~/server/api/services/messages.service";
import { api } from "~/trpc/react";
import { ChatArea } from "../../../_components/messages/chat-area";
import { ConversationsSidebar } from "../../../_components/messages/conversations-sidebar";

interface ConversationPageClientProps {
  readonly conversationId: string;
}

export function ConversationPageClient({
  conversationId,
}: ConversationPageClientProps) {
  const router = useRouter();

  // Get the specific conversation
  const { data: conversations, isLoading } =
    api.messages.getConversations.useQuery({
      limit: 50,
    });

  const selectedConversation = conversations?.find(
    (conv) => conv.id === conversationId,
  );

  // If not loading and conversation not found, show 404
  if (!isLoading && conversations && !selectedConversation) {
    notFound();
  }

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

  const handleBack = () => {
    router.push("/messages");
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Always show sidebar */}
      <ConversationsSidebar
        onConversationSelect={handleConversationSelect}
        selectedConversationId={conversationId}
      />

      {/* Show chat area for selected conversation */}
      <ChatArea
        conversation={selectedConversation}
        onUserSelect={handleUserSelect}
        onBack={handleBack}
      />
    </div>
  );
}
