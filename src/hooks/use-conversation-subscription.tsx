import type * as Ably from "ably";
import { useAbly } from "ably/react";
import React from "react";
import { z } from "zod";
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

// Zod schemas for runtime validation
const reactionAddedEventSchema = z.object({
  type: z.literal("reaction_added"),
  messageId: z.string(),
  reaction: z.object({
    id: z.string(),
    emoji: z.string(),
    userId: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      username: z.string(),
    }),
  }),
  timestamp: z.union([z.date(), z.string()]),
});

const reactionRemovedEventSchema = z.object({
  type: z.literal("reaction_removed"),
  messageId: z.string(),
  userId: z.string(),
  timestamp: z.union([z.date(), z.string()]),
});

const reactionEventSchema = z.union([
  reactionAddedEventSchema,
  reactionRemovedEventSchema,
]);

export type ReactionAddedEventData = z.infer<typeof reactionAddedEventSchema>;
export type ReactionRemovedEventData = z.infer<
  typeof reactionRemovedEventSchema
>;
export type ReactionEventData = z.infer<typeof reactionEventSchema>;

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
      // Validate that the incoming data matches ReactionEventData structure
      const { data, success } = reactionEventSchema.safeParse(message.data);

      if (!success) {
        console.warn("❌ Invalid reaction event data received");
        return;
      }

      // Normalize timestamp to Date object if it's a string
      if (data.type === "reaction_added") {
        const normalizedData: ReactionAddedEventData = {
          ...data,
          timestamp:
            data.timestamp instanceof Date
              ? data.timestamp
              : new Date(data.timestamp),
        };
        onReactionUpdated(normalizedData);
      } else {
        const normalizedData: ReactionRemovedEventData = {
          ...data,
          timestamp:
            data.timestamp instanceof Date
              ? data.timestamp
              : new Date(data.timestamp),
        };
        onReactionUpdated(normalizedData);
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
