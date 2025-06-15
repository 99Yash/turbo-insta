import { z } from "zod";
import { storedFileSchema } from "~/types";

export const messageTypeSchema = z.enum(["text", "image", "file", "system"]);

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  type: messageTypeSchema.default("text"),
  attachments: z.array(storedFileSchema).optional(),
});

export const getConversationsSchema = z.object({
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
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

export const getConversationSchema = z.object({
  conversationId: z.string().min(1),
});

export const markAsReadSchema = z.object({
  conversationId: z.string().min(1),
});

export const createOrGetConversationSchema = z.object({
  participant2Id: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetConversationsInput = z.infer<typeof getConversationsSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
export type GetConversationInput = z.infer<typeof getConversationSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type CreateOrGetConversationInput = z.infer<
  typeof createOrGetConversationSchema
>;
