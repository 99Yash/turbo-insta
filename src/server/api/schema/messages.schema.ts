import { z } from "zod";
import { MAX_REALTIME_MESSAGES } from "~/hooks/use-chat-messages";

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  text: z.string().min(1, "Message text is required"),
  files: z
    .array(
      z.object({
        id: z.string().min(1, "File ID is required"),
        name: z.string(),
        url: z.string().url("Invalid URL"),
        alt: z.string().optional(),
      }),
    )
    .optional(),
});

export const getUserConversationsSchema = z.object({
  limit: z.number().min(1).max(MAX_REALTIME_MESSAGES),
});

export const getOrCreateConversationSchema = z.object({
  otherUserId: z.string().min(1, "Other user ID is required"),
});

export const getConversationMessagesSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const addMessageReactionSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  emoji: z.string().min(1, "Emoji is required").max(15, "Emoji too long"),
});

export const removeMessageReactionSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export const deleteConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export const markConversationAsReadSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetUserConversationsInput = z.infer<
  typeof getUserConversationsSchema
>;
export type GetOrCreateConversationInput = z.infer<
  typeof getOrCreateConversationSchema
>;
export type GetConversationMessagesInput = z.infer<
  typeof getConversationMessagesSchema
>;
export type AddMessageReactionInput = z.infer<typeof addMessageReactionSchema>;
export type RemoveMessageReactionInput = z.infer<
  typeof removeMessageReactionSchema
>;
export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;
export type MarkConversationAsReadInput = z.infer<
  typeof markConversationAsReadSchema
>;
