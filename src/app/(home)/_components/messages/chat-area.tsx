"use client";

import React from "react";
import { Icons } from "~/components/icons";
import { useUser } from "~/contexts/user-context";
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
  readonly conversation?: ConversationWithParticipants | null;
  readonly onUserSelect: (userId: string) => void;
  readonly onBack?: () => void;
}

export function ChatArea({
  conversation,
  onUserSelect,
  onBack,
}: ChatAreaProps) {
  const { user, isLoading: isUserLoading } = useUser();
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
    limit: 30, // Reasonable page size for smooth scrolling
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

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;

      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const scrollThreshold = 100; // pixels from bottom to consider "near bottom"
        const isNearBottom =
          scrollTop + clientHeight >= scrollHeight - scrollThreshold;

        // Auto-scroll on initial load or if user is near the bottom
        if (isInitialLoad || (shouldAutoScroll && isNearBottom)) {
          messagesEndRef.current.scrollIntoView({
            behavior: isInitialLoad ? "instant" : "smooth",
          });

          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
        }
      } else {
        // Fallback: if we can't get scroll position, auto-scroll (initial load case)
        messagesEndRef.current.scrollIntoView({
          behavior: isInitialLoad ? "instant" : "smooth",
        });

        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    }
  }, [messages.length, isInitialLoad, shouldAutoScroll]);

  // Reset initial load state when conversation changes
  React.useEffect(() => {
    setIsInitialLoad(true);
    setShouldAutoScroll(true);
  }, [conversation?.id]);

  // Store scroll position for maintaining position during pagination
  const [scrollPositionBeforeLoad, setScrollPositionBeforeLoad] =
    React.useState<{
      scrollTop: number;
      scrollHeight: number;
    } | null>(null);

  // Maintain scroll position after loading older messages
  React.useLayoutEffect(() => {
    if (scrollPositionBeforeLoad && !isFetchingNextPage) {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;

      if (scrollContainer) {
        const { scrollTop, scrollHeight } = scrollPositionBeforeLoad;
        const newScrollHeight = scrollContainer.scrollHeight;
        const heightDifference = newScrollHeight - scrollHeight;

        if (heightDifference > 0) {
          scrollContainer.scrollTop = scrollTop + heightDifference;
        }
      }

      setScrollPositionBeforeLoad(null);
    }
  }, [isFetchingNextPage, scrollPositionBeforeLoad]);

  // Handle scroll for loading more messages and auto-scroll behavior
  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

      // Load more threshold - trigger when user is within 200px of the top
      const loadMoreThreshold = 200;

      // Auto-scroll threshold - consider user "near bottom" if within 100px
      const autoScrollThreshold = 100;

      // Check if user is near the bottom for auto-scroll behavior
      const isNearBottom =
        scrollTop + clientHeight >= scrollHeight - autoScrollThreshold;
      setShouldAutoScroll(isNearBottom);

      // If scrolled near the top and we have more messages to load
      if (
        scrollTop <= loadMoreThreshold &&
        hasNextPage &&
        !isFetchingNextPage &&
        !scrollPositionBeforeLoad
      ) {
        // Store current scroll position before loading
        setScrollPositionBeforeLoad({
          scrollTop,
          scrollHeight,
        });

        void fetchNextPage();
      }
    },
    [
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      setShouldAutoScroll,
      scrollPositionBeforeLoad,
    ],
  );

  const handleUserSelect = React.useCallback(
    (userId: string) => {
      onUserSelect(userId);
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

  // Show loading state if user is still loading
  if (isUserLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Icons.spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

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
        hasNextPage={hasNextPage}
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
