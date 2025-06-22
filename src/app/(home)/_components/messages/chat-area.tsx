"use client";

import React from "react";
import { useAuthenticatedUser } from "~/contexts/user-context";
import { useChatMessages } from "~/hooks/use-chat-messages";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessagesList } from "./messages-list";
import { NewMessageModal } from "./new-message-modal";

// Use inferred types from router outputs
type ConversationWithParticipants =
  RouterOutputs["messages"]["getOrCreateConversation"];

interface ChatAreaProps {
  readonly conversation?: ConversationWithParticipants;
  readonly onUserSelect?: (userId: string) => void;
  readonly onBack?: () => void;
}

export function ChatArea({
  conversation,
  onUserSelect,
  onBack,
}: ChatAreaProps) {
  const user = useAuthenticatedUser();
  const [showNewMessageModal, setShowNewMessageModal] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Use the custom hook for message management
  const {
    messages,
    isLoadingMessages,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    sendMessage,
    addReaction,
    removeReaction,
    isSendingMessage,
  } = useChatMessages({
    conversationId: conversation?.id,
    limit: 50,
  });

  const markAsReadMutation = api.messages.markConversationAsRead.useMutation();
  const utils = api.useUtils();

  // Mark conversation as read when opened
  React.useEffect(() => {
    if (conversation?.id && conversation.unreadCount > 0) {
      markAsReadMutation.mutate(
        { conversationId: conversation.id },
        {
          onSuccess: () => {
            // Invalidate conversations to update unread counts
            void utils.messages.getConversations.invalidate();
          },
          onError: (error) => {
            console.error(
              `❌ [ChatArea] Failed to mark conversation as read:`,
              error,
            );
          },
        },
      );
    }
  }, [
    conversation?.id,
    conversation?.unreadCount,
    markAsReadMutation,
    utils.messages.getConversations,
  ]);

  // Auto-scroll to bottom when messages change, but only if user is near the bottom
  React.useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && !isFetchingNextPage) {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;

      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const scrollThreshold = 100; // pixels from bottom to consider "near bottom"
        const isNearBottom =
          scrollTop + clientHeight >= scrollHeight - scrollThreshold;

        // Only auto-scroll if user is near the bottom
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        // Fallback: if we can't get scroll position, auto-scroll (initial load case)
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length, isFetchingNextPage]);

  // Handle scroll to top for loading more messages
  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = event.currentTarget;

      // If scrolled to top and we have more messages to load
      if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const handleUserSelect = React.useCallback(
    (userId: string) => {
      onUserSelect?.(userId);
    },
    [onUserSelect],
  );

  /**
   * Get the participant who is NOT the current user
   */
  const getOtherParticipant = React.useCallback(
    (conversation: ConversationWithParticipants) => {
      return conversation.participant1.id === user?.id
        ? conversation.participant2
        : conversation.participant1;
    },
    [user?.id],
  );

  const handleSendMessage = React.useCallback(() => {
    if (!messageText.trim() || !conversation || isSendingMessage) return;

    const otherParticipant = getOtherParticipant(conversation);
    sendMessage(messageText.trim(), otherParticipant.id);
    setMessageText("");
  }, [
    messageText,
    conversation,
    getOtherParticipant,
    sendMessage,
    isSendingMessage,
  ]);

  // Empty state when no conversation is selected
  if (!conversation) {
    return (
      <>
        <ChatEmptyState onNewMessage={() => setShowNewMessageModal(true)} />

        {/* New Message Modal */}
        {showNewMessageModal && (
          <NewMessageModal
            open={showNewMessageModal}
            onOpenChange={setShowNewMessageModal}
            onUserSelect={handleUserSelect}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen flex-1 flex-col bg-background">
      {/* Chat header */}
      <ChatHeader
        conversation={conversation}
        currentUserId={user?.id ?? ""}
        onBack={onBack}
      />

      {/* Messages area */}
      <MessagesList
        conversation={conversation}
        currentUserId={user?.id ?? ""}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        isFetchingNextPage={isFetchingNextPage}
        onScroll={handleScroll}
        onAddReaction={addReaction}
        onRemoveReaction={removeReaction}
        scrollAreaRef={scrollAreaRef}
        messagesEndRef={messagesEndRef}
      />

      {/* Message input */}
      <MessageInput
        messageText={messageText}
        onMessageTextChange={setMessageText}
        onSendMessage={handleSendMessage}
        isSending={isSendingMessage}
      />
    </div>
  );
}
