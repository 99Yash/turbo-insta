"use client";

import { notFound, useRouter } from "next/navigation";
import { Icons } from "~/components/icons";
import { MAX_REALTIME_MESSAGES } from "~/hooks/use-chat-messages";
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
  const utils = api.useUtils();

  console.log(
    "🔍 [ConversationPageClient] Loading conversation:",
    conversationId,
  );

  // Get the specific conversation
  const { data: conversations, isLoading } =
    api.messages.getConversations.useQuery({
      limit: MAX_REALTIME_MESSAGES,
    });

  const selectedConversation = conversations?.find(
    (conv) => conv.id === conversationId,
  );

  console.log("📊 [ConversationPageClient] Conversation lookup:", {
    conversationId,
    isLoading,
    totalConversations: conversations?.length ?? 0,
    foundConversation: !!selectedConversation,
    conversations: conversations?.map((conv) => ({
      id: conv.id,
      participants: [conv.participant1.username, conv.participant2.username],
    })),
  });

  // If not loading and conversation not found, show 404
  if (!isLoading && conversations && !selectedConversation) {
    console.log(
      "❌ [ConversationPageClient] Conversation not found, showing 404",
    );
    notFound();
  }

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

  const handleBack = () => {
    router.push("/messages");
  };

  // Show loading state while conversations are being fetched
  if (isLoading || !conversations) {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Hide sidebar on mobile when viewing conversation */}
        <div className="hidden lg:block">
          <ConversationsSidebar
            onConversationSelect={handleConversationSelect}
            selectedConversationId={conversationId}
          />
        </div>

        {/* Show loading state for chat area */}
        <div className="flex flex-1 items-center justify-center bg-background">
          <div className="text-center">
            <Icons.spinner className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading conversation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Hide sidebar on mobile when viewing conversation */}
      <div className="hidden lg:block">
        <ConversationsSidebar
          onConversationSelect={handleConversationSelect}
          selectedConversationId={conversationId}
        />
      </div>

      {/* Show chat area for selected conversation - full width on mobile */}
      <div className="flex-1">
        <ChatArea
          conversation={selectedConversation}
          onUserSelect={handleUserSelect}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
