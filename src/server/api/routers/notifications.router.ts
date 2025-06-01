import {
  deleteNotificationsSchema,
  getNotificationsSchema,
  markAsReadSchema,
} from "../schema/notifications.schema";
import {
  deleteNotifications,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
} from "../services/notifications.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notificationsRouter = createTRPCRouter({
  /**
   * Get paginated notifications for the current user
   */
  getAll: protectedProcedure
    .input(getNotificationsSchema)
    .query(async ({ input, ctx }) => {
      return getNotifications({
        userId: ctx.userId,
        cursor: input.cursor,
        limit: input.limit,
      });
    }),

  /**
   * Get unread notification count for the current user
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadNotificationCount(ctx.userId);
  }),

  /**
   * Mark notifications as read
   */
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ input, ctx }) => {
      return markNotificationsAsRead(ctx.userId, input.notificationIds);
    }),

  /**
   * Delete notifications
   */
  delete: protectedProcedure
    .input(deleteNotificationsSchema)
    .mutation(async ({ input, ctx }) => {
      return deleteNotifications(ctx.userId, input.notificationIds);
    }),
});
