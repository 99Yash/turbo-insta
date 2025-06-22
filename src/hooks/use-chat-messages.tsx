import React from "react";
import {
  useConversationSubscription,
  type ReactionEventData,
} from "~/hooks/use-conversation-subscription";
import { showErrorToast } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

type MessageWithSender =
  RouterOutputs["messages"]["getConversationMessages"]["messages"][number];

interface UseChatMessagesProps {
  readonly conversationId?: string;
  readonly limit?: number;
}

interface UseChatMessagesReturn {
  readonly messages: MessageWithSender[];
  readonly isLoadingMessages: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly sendMessage: (text: string, receiverId: string) => void;
  readonly addReaction: (messageId: string, emoji: string) => void;
  readonly removeReaction: (messageId: string) => void;
  readonly isSendingMessage: boolean;
}

export const MAX_REALTIME_MESSAGES = 10;
export const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000;

/**
 * Custom hook that encapsulates message state management and real-time updates
 */
export function useChatMessages({
  conversationId,
  limit = MAX_REALTIME_MESSAGES,
}: UseChatMessagesProps): UseChatMessagesReturn {
  // Real-time message updates state with metadata for cleanup
  const [realtimeMessages, setRealtimeMessages] = React.useState<
    Map<string, MessageWithSender & { addedAt: number }>
  >(new Map());

  /**
   * Cleans up old and excess messages from the realtime messages map
   */
  const cleanupRealtimeMessages = React.useCallback(
    (currentMap: Map<string, MessageWithSender & { addedAt: number }>) => {
      const now = Date.now();
      const entries = Array.from(currentMap.entries());

      // Filter out messages that are too old
      const recentEntries = entries.filter(
        ([, messageWithMeta]) =>
          now - messageWithMeta.addedAt <= MAX_MESSAGE_AGE_MS,
      );

      // If we still have too many messages, keep only the most recent ones
      const limitedEntries = recentEntries
        .sort(([, a], [, b]) => b.addedAt - a.addedAt) // Sort by addedAt descending
        .slice(0, MAX_REALTIME_MESSAGES);

      // Return a new map with cleaned entries
      const cleanedMap = new Map(limitedEntries);

      return cleanedMap;
    },
    [],
  );

  // Server data fetching
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.messages.getConversationMessages.useInfiniteQuery(
    {
      conversationId: conversationId ?? "",
      limit,
    },
    {
      enabled: !!conversationId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Derive final messages list combining server data with real-time updates
  const messages = React.useMemo(() => {
    const allServerMessages =
      messagesData?.pages?.flatMap((page) => page.messages) ?? [];

    if (allServerMessages.length === 0 && realtimeMessages.size === 0) {
      return [];
    }

    const messagesMap = new Map<string, MessageWithSender>();

    // Add server messages
    allServerMessages.forEach((msg) => {
      messagesMap.set(msg.id, msg);
    });

    // Apply real-time updates (strip addedAt metadata when deriving final messages)
    realtimeMessages.forEach((updateWithMeta, id) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { addedAt, ...update } = updateWithMeta;
      messagesMap.set(id, update as MessageWithSender);
    });

    const finalMessages = Array.from(messagesMap.values()).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return finalMessages;
  }, [messagesData?.pages, realtimeMessages]);

  // Clear real-time messages when conversation changes
  React.useEffect(() => {
    setRealtimeMessages(new Map());
  }, [conversationId]);

  // Periodic cleanup of old real-time messages
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeMessages((prev) => {
        if (prev.size === 0) return prev;
        const cleaned = cleanupRealtimeMessages(prev);
        return cleaned.size !== prev.size ? cleaned : prev;
      });
    }, 30000); // Clean up every 30 seconds

    return () => clearInterval(interval);
  }, [cleanupRealtimeMessages]);

  // Handle real-time message updates
  const handleMessageReceived = React.useCallback(
    (message: MessageWithSender) => {
      const messageWithTimestamp = {
        ...message,
        addedAt: Date.now(),
      };

      setRealtimeMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(message.id, messageWithTimestamp);
        // Clean up old/excess messages after adding new one
        return cleanupRealtimeMessages(newMap);
      });
    },
    [cleanupRealtimeMessages],
  );

  const handleReactionUpdated = React.useCallback(
    (reactionData: ReactionEventData) => {
      if (reactionData.messageId) {
        if (reactionData.type === "reaction_added") {
          // Add reaction to the message
          setRealtimeMessages((prev) => {
            const newMap = new Map(prev);

            // Find the message to update (from real-time state only)
            // If the message isn't in real-time state, the server will handle the reaction
            // and it will be included in future fetches
            const messageToUpdate = newMap.get(reactionData.messageId);

            if (messageToUpdate) {
              const updatedMessage = {
                ...messageToUpdate,
                reactions: [
                  // Remove any existing reaction from this user first
                  ...messageToUpdate.reactions.filter(
                    (r) => r.userId !== reactionData.reaction.userId,
                  ),
                  // Add the new reaction
                  reactionData.reaction,
                ],
                addedAt: messageToUpdate.addedAt, // Preserve the addedAt timestamp
              };
              newMap.set(reactionData.messageId, updatedMessage);
            }

            return newMap;
          });
        } else if (reactionData.type === "reaction_removed") {
          // Remove user's reaction from the message
          setRealtimeMessages((prev) => {
            const newMap = new Map(prev);

            // Find the message to update (from real-time state only)
            const messageToUpdate = newMap.get(reactionData.messageId);

            if (messageToUpdate) {
              const updatedMessage = {
                ...messageToUpdate,
                reactions: messageToUpdate.reactions.filter(
                  (r) => r.userId !== reactionData.userId,
                ),
                addedAt: messageToUpdate.addedAt, // Preserve the addedAt timestamp
              };
              newMap.set(reactionData.messageId, updatedMessage);
            }

            return newMap;
          });
        }
      }
    },
    [],
  );

  // Use custom hook for real-time subscription
  useConversationSubscription({
    conversationId,
    onMessageReceived: handleMessageReceived,
    onReactionUpdated: handleReactionUpdated,
  });

  // Mutations
  const sendMessageMutation = api.messages.sendMessage.useMutation({
    onSuccess: (sentMessage) => {
      // Add to real-time messages for immediate display
      setRealtimeMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(sentMessage.id, {
          ...sentMessage,
          addedAt: Date.now(),
        });
        // Clean up old/excess messages after adding new one
        return cleanupRealtimeMessages(newMap);
      });
    },
    onError: (error) => {
      showErrorToast(error);
      console.error("❌ [useChatMessages] Failed to send message:", error);
    },
  });

  const addReactionMutation = api.messages.addReaction.useMutation({
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const removeReactionMutation = api.messages.removeReaction.useMutation({
    onError: (error) => {
      showErrorToast(error);
    },
  });

  // Exposed functions
  const sendMessage = React.useCallback(
    (text: string, receiverId: string) => {
      if (!text.trim() || sendMessageMutation.isPending) return;

      sendMessageMutation.mutate({
        receiverId,
        text: text.trim(),
      });
    },
    [sendMessageMutation],
  );

  const addReaction = React.useCallback(
    (messageId: string, emoji: string) => {
      addReactionMutation.mutate({ messageId, emoji });
    },
    [addReactionMutation],
  );

  const removeReaction = React.useCallback(
    (messageId: string) => {
      removeReactionMutation.mutate({ messageId });
    },
    [removeReactionMutation],
  );

  return {
    messages,
    isLoadingMessages,
    isFetchingNextPage: isFetchingNextPage ?? false,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage: () => void fetchNextPage(),
    sendMessage,
    addReaction,
    removeReaction,
    isSendingMessage: sendMessageMutation.isPending,
  };
}
