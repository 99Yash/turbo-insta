import { z } from "zod";

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
  limit: z.number().min(1).max(50).default(10),
});

export const getOrCreateConversationSchema = z.object({
  otherUserId: z.string().min(1, "Other user ID is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetUserConversationsInput = z.infer<
  typeof getUserConversationsSchema
>;
export type GetOrCreateConversationInput = z.infer<
  typeof getOrCreateConversationSchema
>;
