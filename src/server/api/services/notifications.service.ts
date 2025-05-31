import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, count, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { db } from "~/server/db";
import {
  commentReplies,
  comments,
  notifications,
  posts,
  users,
  type NewNotification,
  type Notification,
  type NotificationType,
} from "~/server/db/schema";
import { notificationEvents } from "../lib/events";

export interface CreateNotificationInput {
  readonly recipientId: string;
  readonly actorId: string;
  readonly type: NotificationType;
  readonly postId?: string;
  readonly commentId?: string;
  readonly replyId?: string;
  readonly likeId?: string;
  readonly commentLikeId?: string;
  readonly followId?: string;
  readonly message?: string;
}

export interface GetNotificationsInput {
  readonly userId: string;
  readonly cursor?: {
    readonly id: string;
    readonly createdAt: Date;
  };
  readonly limit?: number;
}

export interface NotificationWithDetails extends Notification {
  readonly actor: {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly imageUrl: string | null;
  };
  readonly post?: {
    readonly id: string;
    readonly title: string | null;
    readonly images: unknown;
  } | null;
  readonly comment?: {
    readonly id: string;
    readonly text: string | null;
  } | null;
  readonly reply?: {
    readonly id: string;
    readonly text: string | null;
  } | null;
}

/**
 * Create a new notification and emit real-time event
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<Notification> {
  try {
    // Don't create notification if actor and recipient are the same
    if (input.actorId === input.recipientId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot create notification for self-action",
      });
    }

    // Check for duplicate notifications (same type, same entities, within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, input.recipientId),
          eq(notifications.actorId, input.actorId),
          eq(notifications.type, input.type),
          input.postId ? eq(notifications.postId, input.postId) : undefined,
          input.commentId
            ? eq(notifications.commentId, input.commentId)
            : undefined,
          input.replyId ? eq(notifications.replyId, input.replyId) : undefined,
          gt(notifications.createdAt, oneHourAgo),
        ),
      )
      .limit(1);

    if (existingNotification.length > 0) {
      return existingNotification[0]!;
    }

    const notificationData: NewNotification = {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId,
      commentId: input.commentId,
      replyId: input.replyId,
      likeId: input.likeId,
      commentLikeId: input.commentLikeId,
      followId: input.followId,
      message: input.message,
      isRead: false,
    };

    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();

    if (!notification) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create notification",
      });
    }

    // Emit real-time event
    notificationEvents.emitNotification({
      id: notification.id,
      type: notification.type,
      recipientId: notification.recipientId,
      actorId: notification.actorId,
      data: notification,
    });

    return notification;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(input: GetNotificationsInput): Promise<{
  notifications: NotificationWithDetails[];
  nextCursor?: { id: string; createdAt: Date };
}> {
  try {
    const { userId, cursor, limit = 20 } = input;

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          cursor
            ? or(
                lt(notifications.createdAt, cursor.createdAt),
                and(
                  eq(notifications.createdAt, cursor.createdAt),
                  lt(notifications.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit + 1);

    // Get unique actor IDs
    const actorIds = [...new Set(userNotifications.map((n) => n.actorId))];

    // Get actor details
    const actors =
      actorIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              username: users.username,
              imageUrl: users.imageUrl,
            })
            .from(users)
            .where(inArray(users.id, actorIds))
        : [];

    // Get related posts, comments, replies for context
    const postIds = userNotifications
      .map((n) => n.postId)
      .filter(Boolean) as string[];
    const commentIds = userNotifications
      .map((n) => n.commentId)
      .filter(Boolean) as string[];
    const replyIds = userNotifications
      .map((n) => n.replyId)
      .filter(Boolean) as string[];

    const [relatedPosts, relatedComments, relatedReplies] = await Promise.all([
      postIds.length > 0
        ? db
            .select({
              id: posts.id,
              title: posts.title,
              images: posts.images,
            })
            .from(posts)
            .where(inArray(posts.id, postIds))
        : [],
      commentIds.length > 0
        ? db
            .select({
              id: comments.id,
              text: comments.text,
            })
            .from(comments)
            .where(inArray(comments.id, commentIds))
        : [],
      replyIds.length > 0
        ? db
            .select({
              id: commentReplies.id,
              text: commentReplies.text,
            })
            .from(commentReplies)
            .where(inArray(commentReplies.id, replyIds))
        : [],
    ]);

    // Combine notifications with details
    const notificationsWithDetails: NotificationWithDetails[] =
      userNotifications.map((notification) => {
        const actor = actors.find((a) => a.id === notification.actorId);
        const post = relatedPosts.find((p) => p.id === notification.postId);
        const comment = relatedComments.find(
          (c) => c.id === notification.commentId,
        );
        const reply = relatedReplies.find((r) => r.id === notification.replyId);

        return {
          ...notification,
          actor: actor ?? {
            id: notification.actorId,
            name: "Unknown User",
            username: "unknown",
            imageUrl: null,
          },
          post: post ?? null,
          comment: comment ?? null,
          reply: reply ?? null,
        };
      });

    let nextCursor: { id: string; createdAt: Date } | undefined = undefined;
    if (userNotifications.length > limit) {
      const nextItem = userNotifications.pop()!;
      nextCursor = {
        id: nextItem.id,
        createdAt: nextItem.createdAt,
      };
    }

    return {
      notifications: notificationsWithDetails,
      nextCursor,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Mark notification(s) as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds?: string[],
): Promise<{ count: number }> {
  try {
    const whereCondition = notificationIds
      ? and(
          eq(notifications.recipientId, userId),
          inArray(notifications.id, notificationIds),
        )
      : eq(notifications.recipientId, userId);

    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(whereCondition);

    return { count: Number(result.count) };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<{ count: number }> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.isRead, false),
        ),
      );

    return { count: result?.count ?? 0 };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Delete notification(s)
 */
export async function deleteNotifications(
  userId: string,
  notificationIds: string[],
): Promise<{ count: number }> {
  try {
    const result = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          inArray(notifications.id, notificationIds),
        ),
      );

    return { count: Number(result.count) };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
