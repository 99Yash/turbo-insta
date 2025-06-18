import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "like",
  "comment",
  "reply",
  "follow",
  "comment_like",
  "reply_like",
  "mention",
]);

export const createNotificationSchema = z.object({
  recipientId: z.string().min(1),
  actorId: z.string().min(1),
  type: notificationTypeSchema,
  postId: z.string().optional(),
  commentId: z.string().optional(),
  replyId: z.string().optional(),
  likeId: z.string().optional(),
  commentLikeId: z.string().optional(),
  followId: z.string().optional(),
  message: z.string().optional(),
});

export const getNotificationsSchema = z.object({
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.date(),
    })
    .optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
});

export const deleteNotificationsSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
});

export const subscriptionSchema = z.object({
  lastEventId: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type DeleteNotificationsInput = z.infer<
  typeof deleteNotificationsSchema
>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
