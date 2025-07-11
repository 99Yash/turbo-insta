import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, count, desc, eq, inArray, lt, or } from "drizzle-orm";
import { LIMITS } from "~/lib/constants";
import { db } from "~/server/db";
import {
  commentLikes,
  commentReplies,
  commentReplyLikes,
  comments,
  posts,
  users,
} from "~/server/db/schema";
import {
  type GetCommentsInput,
  type GetRepliesInput,
  type createCommentSchema,
  type createReplySchema,
  type deleteCommentSchema,
  type deleteReplySchema,
} from "../schema/comments.schema";
import { type WithOptionalUserId, type WithUser } from "../schema/user.schema";
import { createNotification } from "./notifications.service";

export async function createComment(
  input: WithUser<typeof createCommentSchema>,
) {
  try {
    const [comment] = await db
      .insert(comments)
      .values({
        text: input.text,
        userId: input.userId,
        postId: input.postId,
      })
      .returning();

    if (!comment) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create comment",
      });
    }

    // Get the post owner to create notification
    const [post] = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, input.postId))
      .limit(1);

    // Create notification for post owner (if not commenting on own post)
    if (post && post.userId !== input.userId) {
      try {
        await createNotification({
          recipientId: post.userId,
          actorId: input.userId,
          type: "comment",
          postId: input.postId,
          commentId: comment.id,
        });
      } catch (notificationError) {
        console.error(
          "Failed to create comment notification:",
          notificationError,
        );
      }
    }

    return comment;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getComments(input: WithOptionalUserId<GetCommentsInput>) {
  try {
    const { postId, cursor, userId } = input;
    const limit = LIMITS.GET_COMMENTS;

    const postComments = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.postId, postId),
          cursor
            ? or(
                // Get comments created before the cursor date
                lt(comments.createdAt, cursor.createdAt),
                // Or get comments created at the same time but with smaller ID
                and(
                  eq(comments.createdAt, cursor.createdAt),
                  lt(comments.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(limit + 1);

    const userIds = [...new Set(postComments.map((comment) => comment.userId))];

    const authors =
      userIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              imageUrl: users.imageUrl,
              username: users.username,
            })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];

    // Get like counts for each comment
    const commentIds = postComments.map((comment) => comment.id);
    const likeCounts =
      commentIds.length > 0
        ? await db
            .select({
              commentId: commentLikes.commentId,
              count: count(),
            })
            .from(commentLikes)
            .where(inArray(commentLikes.commentId, commentIds))
            .groupBy(commentLikes.commentId)
        : [];

    // Get user's likes if userId is provided
    const userLikes =
      userId && commentIds.length > 0
        ? await db
            .select({
              commentId: commentLikes.commentId,
            })
            .from(commentLikes)
            .where(
              and(
                eq(commentLikes.userId, userId),
                inArray(commentLikes.commentId, commentIds),
              ),
            )
        : [];

    const commentsWithUser = postComments.map((comment) => {
      const user = authors.find((u) => u.id === comment.userId);
      const likeCount =
        likeCounts.find((lc) => lc.commentId === comment.id)?.count ?? 0;
      const hasLiked = userLikes.some((ul) => ul.commentId === comment.id);

      return {
        ...comment,
        user: user
          ? {
              id: user.id,
              name: user.name,
              username: user.username,
              imageUrl: user.imageUrl,
            }
          : null,
        likeCount,
        hasLiked,
      };
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (postComments.length > limit) {
      const nextItem = postComments.pop()!;
      nextCursor = {
        id: nextItem.id,
        createdAt: nextItem.createdAt,
      };
    }

    return {
      comments: commentsWithUser,
      nextCursor,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function deleteComment({
  commentId,
  userId,
}: WithUser<typeof deleteCommentSchema>) {
  try {
    // First check if the comment exists and belongs to the user
    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .limit(1);

    if (!comment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Comment not found or you don't have permission to delete it",
      });
    }

    // Delete the comment
    await db.delete(comments).where(eq(comments.id, commentId));

    return { success: true };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

// Reply functions
export async function createReply(input: WithUser<typeof createReplySchema>) {
  try {
    const [reply] = await db
      .insert(commentReplies)
      .values({
        text: input.text,
        userId: input.userId,
        commentId: input.commentId,
      })
      .returning();

    if (!reply) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create reply",
      });
    }

    // Get the comment owner to create notification
    const [comment] = await db
      .select({ userId: comments.userId })
      .from(comments)
      .where(eq(comments.id, input.commentId))
      .limit(1);

    // Create notification for comment owner (if not replying to own comment)
    if (comment && comment.userId !== input.userId) {
      try {
        await createNotification({
          recipientId: comment.userId,
          actorId: input.userId,
          type: "reply",
          commentId: input.commentId,
          replyId: reply.id,
        });
      } catch (notificationError) {
        console.error(
          "Failed to create reply notification:",
          notificationError,
        );
      }
    }

    return reply;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getReplies(input: WithOptionalUserId<GetRepliesInput>) {
  try {
    const { commentId, cursor, userId } = input;

    const replies = await db
      .select()
      .from(commentReplies)
      .where(
        and(
          eq(commentReplies.commentId, commentId),
          cursor
            ? or(
                // Get replies created before the cursor date
                lt(commentReplies.createdAt, cursor.createdAt),
                // Or get replies created at the same time but with smaller ID
                and(
                  eq(commentReplies.createdAt, cursor.createdAt),
                  lt(commentReplies.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(commentReplies.createdAt), desc(commentReplies.id))
      .limit(LIMITS.GET_REPLIES + 1);

    const userIds = [...new Set(replies.map((reply) => reply.userId))];

    const authors =
      userIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              imageUrl: users.imageUrl,
              username: users.username,
            })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];

    // Get like counts for each reply
    const replyIds = replies.map((reply) => reply.id);
    const likeCounts =
      replyIds.length > 0
        ? await db
            .select({
              commentReplyId: commentReplyLikes.commentReplyId,
              count: count(),
            })
            .from(commentReplyLikes)
            .where(inArray(commentReplyLikes.commentReplyId, replyIds))
            .groupBy(commentReplyLikes.commentReplyId)
        : [];

    // Get user's likes if userId is provided
    const userLikes =
      userId && replyIds.length > 0
        ? await db
            .select({
              commentReplyId: commentReplyLikes.commentReplyId,
            })
            .from(commentReplyLikes)
            .where(
              and(
                eq(commentReplyLikes.userId, userId),
                inArray(commentReplyLikes.commentReplyId, replyIds),
              ),
            )
        : [];

    const repliesWithUser = replies.map((reply) => {
      const user = authors.find((u) => u.id === reply.userId);
      const likeCount =
        likeCounts.find((lc) => lc.commentReplyId === reply.id)?.count ?? 0;
      const hasLiked = userLikes.some((ul) => ul.commentReplyId === reply.id);

      return {
        ...reply,
        user: user
          ? {
              id: user.id,
              name: user.name,
              username: user.username,
              imageUrl: user.imageUrl,
            }
          : null,
        likeCount,
        hasLiked,
      };
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (replies.length > LIMITS.GET_REPLIES) {
      const nextItem = replies.pop()!;
      nextCursor = {
        id: nextItem.id,
        createdAt: nextItem.createdAt,
      };
    }

    return {
      replies: repliesWithUser,
      nextCursor,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function deleteReply({
  replyId,
  userId,
}: WithUser<typeof deleteReplySchema>) {
  try {
    // First check if the reply exists and belongs to the user
    const [reply] = await db
      .select()
      .from(commentReplies)
      .where(
        and(eq(commentReplies.id, replyId), eq(commentReplies.userId, userId)),
      )
      .limit(1);

    if (!reply) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Reply not found or you don't have permission to delete it",
      });
    }

    // Delete the reply
    await db.delete(commentReplies).where(eq(commentReplies.id, replyId));

    return { success: true };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getReplyCountsForComments(commentIds: string[]) {
  try {
    if (commentIds.length === 0) {
      return [];
    }

    const replyCounts = await db
      .select({
        commentId: commentReplies.commentId,
        count: count(),
      })
      .from(commentReplies)
      .where(inArray(commentReplies.commentId, commentIds))
      .groupBy(commentReplies.commentId);

    return replyCounts;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
