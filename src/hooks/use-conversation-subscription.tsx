import type * as Ably from "ably";
import { useAbly } from "ably/react";
import React from "react";
import type { RouterOutputs } from "~/trpc/react";

// Use inferred types from router outputs
export type MessageWithSender =
  RouterOutputs["messages"]["getConversationMessages"]["messages"][number];

// Event type definitions
type MessageEventData = {
  readonly type: "new_message";
  readonly message: RouterOutputs["messages"]["sendMessage"];
  readonly conversationId: string;
  readonly timestamp: string;
};

export type ReactionAddedEventData = {
  readonly type: "reaction_added";
  readonly messageId: string;
  readonly reaction: {
    readonly id: string;
    readonly emoji: string;
    readonly userId: string;
    readonly user: {
      readonly id: string;
      readonly name: string;
      readonly username: string;
    };
  };
  readonly timestamp: Date;
};

export type ReactionRemovedEventData = {
  readonly type: "reaction_removed";
  readonly messageId: string;
  readonly userId: string;
  readonly timestamp: Date;
};

export type ReactionEventData =
  | ReactionAddedEventData
  | ReactionRemovedEventData;

interface UseConversationSubscriptionOptions {
  readonly conversationId?: string;
  readonly onMessageReceived: (message: MessageWithSender) => void;
  readonly onReactionUpdated: (data: ReactionEventData) => void;
}

/**
 * Custom hook to manage real-time subscription to conversation events
 * Handles message and reaction updates via Ably channels
 */
export function useConversationSubscription({
  conversationId,
  onMessageReceived,
  onReactionUpdated,
}: UseConversationSubscriptionOptions): void {
  const client = useAbly();

  React.useEffect(() => {
    if (!conversationId || !client) {
      return;
    }

    const conversationChannelName = `conversation:${conversationId}`;
    const channel = client.channels.get(conversationChannelName);

    const messageHandler = (message: Ably.Message) => {
      const data = message.data as MessageEventData;

      if (
        data?.type === "new_message" &&
        data?.conversationId === conversationId &&
        data.message
      ) {
        // Normalize the message to ensure dates are Date objects
        const normalizedMessage = {
          ...data.message,
          createdAt: new Date(data.message.createdAt),
          updatedAt: data.message.updatedAt
            ? new Date(data.message.updatedAt)
            : null,
        };

        onMessageReceived(normalizedMessage);
      }
    };

    const reactionHandler = (message: Ably.Message) => {
      const data = message.data as ReactionEventData;

      if (data.messageId) {
        onReactionUpdated(data);
      }
    };

    // Subscribe with error handling
    channel.subscribe("message", messageHandler).catch((error) => {
      console.error("❌ Failed to subscribe to message events:", error);
    });

    channel.subscribe("reaction", reactionHandler).catch((error) => {
      console.error("❌ Failed to subscribe to reaction events:", error);
    });

    return () => {
      void channel.unsubscribe("message", messageHandler);
      void channel.unsubscribe("reaction", reactionHandler);
    };
  }, [conversationId, client, onMessageReceived, onReactionUpdated]);
}
