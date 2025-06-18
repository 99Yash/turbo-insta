import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, count, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { ably } from "~/lib/ably";
import { db } from "~/server/db";
import {
  commentReplies,
  comments,
  notifications,
  posts,
  users,
  type NewNotification,
  type Notification,
} from "~/server/db/schema";

/**
 * Base notification input with common fields
 */
type BaseNotificationInput = {
  readonly recipientId: string;
  readonly actorId: string;
  readonly message?: string;
};

/**
 * Discriminated union for different notification types
 * Each type requires its specific data fields
 */
export type CreateNotificationInput =
  | (BaseNotificationInput & {
      readonly type: "like";
      readonly postId: string;
      readonly likeId: string;
    })
  | (BaseNotificationInput & {
      readonly type: "comment";
      readonly postId: string;
      readonly commentId: string;
    })
  | (BaseNotificationInput & {
      readonly type: "reply";
      readonly commentId: string;
      readonly replyId: string;
    })
  | (BaseNotificationInput & {
      readonly type: "comment_like";
      readonly commentId: string;
      readonly commentLikeId: string;
    })
  | (BaseNotificationInput & {
      readonly type: "reply_like";
      readonly replyId: string;
      readonly commentReplyLikeId: string;
    })
  | (BaseNotificationInput & {
      readonly type: "follow";
      readonly followId: string;
    })
  | (BaseNotificationInput & {
      readonly type: "mention";
      readonly postId?: string;
      readonly commentId?: string;
      readonly replyId?: string;
      readonly message: string; // Required for mentions
    });

export type GetNotificationsInput = {
  readonly userId: string;
  readonly cursor?: {
    readonly id: string;
    readonly createdAt: Date;
  };
  readonly limit?: number;
};

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

    // Build where conditions based on notification type
    const baseWhereConditions = [
      eq(notifications.recipientId, input.recipientId),
      eq(notifications.actorId, input.actorId),
      eq(notifications.type, input.type),
      gt(notifications.createdAt, oneHourAgo),
    ];

    // Add type-specific conditions
    const typeSpecificConditions = [];
    switch (input.type) {
      case "like":
        typeSpecificConditions.push(eq(notifications.postId, input.postId));
        break;
      case "comment":
        typeSpecificConditions.push(eq(notifications.postId, input.postId));
        typeSpecificConditions.push(
          eq(notifications.commentId, input.commentId),
        );
        break;
      case "reply":
        typeSpecificConditions.push(
          eq(notifications.commentId, input.commentId),
        );
        typeSpecificConditions.push(eq(notifications.replyId, input.replyId));
        break;
      case "comment_like":
        typeSpecificConditions.push(
          eq(notifications.commentId, input.commentId),
        );
        break;
      case "reply_like":
        typeSpecificConditions.push(eq(notifications.replyId, input.replyId));
        break;
      case "follow":
        typeSpecificConditions.push(eq(notifications.followId, input.followId));
        break;
      case "mention":
        if (input.postId) {
          typeSpecificConditions.push(eq(notifications.postId, input.postId));
        }
        if (input.commentId) {
          typeSpecificConditions.push(
            eq(notifications.commentId, input.commentId),
          );
        }
        if (input.replyId) {
          typeSpecificConditions.push(eq(notifications.replyId, input.replyId));
        }
        break;
    }

    const existingNotification = await db
      .select()
      .from(notifications)
      .where(and(...baseWhereConditions, ...typeSpecificConditions))
      .limit(1);

    if (existingNotification[0]) {
      return existingNotification[0];
    }

    // Build notification data based on type
    const baseNotificationData = {
      recipientId: input.recipientId,
      actorId: input.actorId,
      message: input.message,
      isRead: false,
    };

    let notificationData: NewNotification;
    switch (input.type) {
      case "like":
        notificationData = {
          ...baseNotificationData,
          type: "like",
          postId: input.postId,
          likeId: input.likeId,
        };
        break;
      case "comment":
        notificationData = {
          ...baseNotificationData,
          type: "comment",
          postId: input.postId,
          commentId: input.commentId,
        };
        break;
      case "reply":
        notificationData = {
          ...baseNotificationData,
          type: "reply",
          commentId: input.commentId,
          replyId: input.replyId,
        };
        break;
      case "comment_like":
        notificationData = {
          ...baseNotificationData,
          type: "comment_like",
          commentId: input.commentId,
          commentLikeId: input.commentLikeId,
        };
        break;
      case "reply_like":
        notificationData = {
          ...baseNotificationData,
          type: "reply_like",
          replyId: input.replyId,
          commentReplyLikeId: input.commentReplyLikeId,
        };
        break;
      case "follow":
        notificationData = {
          ...baseNotificationData,
          type: "follow",
          followId: input.followId,
        };
        break;
      case "mention":
        notificationData = {
          ...baseNotificationData,
          type: "mention",
          postId: input.postId,
          commentId: input.commentId,
          replyId: input.replyId,
          message: input.message, // Required for mentions
        };
        break;
    }

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

    const unreadCount = await getUnreadNotificationCount(
      notification.recipientId,
    );

    try {
      await ably.channels
        .get(`notifications:${notification.recipientId}`)
        .publish("notification", {
          type: "new_notification",
          unreadCount,
          timestamp: notification.createdAt,
        });

      console.log(
        `✅ Published notification to channel: notifications:${notification.recipientId}`,
        {
          type: notification.type,
          actorId: notification.actorId,
          recipientId: notification.recipientId,
          unreadCount,
        },
      );
    } catch (ablyError) {
      console.error("❌ Failed to publish notification to Ably:", ablyError);
      // Don't throw error, just log it - notification was still created in DB
    }

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
): Promise<number> {
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

    return result?.count ?? 0;
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
