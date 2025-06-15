import { z } from "zod";

export const messageTypeSchema = z.enum(["text", "image", "file", "system"]);

export const messageStatusSchema = z.enum(["sent", "delivered", "read"]);

export const createConversationSchema = z.object({
  participant1Id: z.string().min(1),
  participant2Id: z.string().min(1),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  type: messageTypeSchema.default("text"),
  attachments: z.string().optional(),
});

export const getConversationsSchema = z.object({
  cursor: z
    .object({
      id: z.string(),
      lastMessageAt: z.string(),
    })
    .optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const getMessagesSchema = z.object({
  conversationId: z.string().min(1),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .optional(),
  limit: z.number().min(1).max(100).default(50),
});

export const markAsReadSchema = z.object({
  conversationId: z.string().min(1),
});

export const createOrGetConversationSchema = z.object({
  participant1Id: z.string().min(1),
  participant2Id: z.string().min(1),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetConversationsInput = z.infer<typeof getConversationsSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type CreateOrGetConversationInput = z.infer<
  typeof createOrGetConversationSchema
>;
