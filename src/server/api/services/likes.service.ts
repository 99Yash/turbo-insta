import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { ably } from "~/lib/ably";
import { db } from "~/server/db";
import {
  commentLikes,
  commentReplies,
  commentReplyLikes,
  comments,
  likes,
  posts,
  users,
} from "~/server/db/schema";
import {
  type CommentLikeParams,
  type PostLikeParams,
  type ReplyLikeParams,
  type ToggleLikeInput,
} from "../schema/likes.schema";
import { type WithUserId } from "../schema/user.schema";
import { createNotification } from "./notifications.service";

export async function toggleLike(
  input: WithUserId<ToggleLikeInput>,
): Promise<void> {
  const { userId } = input;

  try {
    switch (input.type) {
      case "post":
        await togglePostLike({ postId: input.postId, userId });
        break;
      case "comment":
        await toggleCommentLike({ commentId: input.commentId, userId });
        break;
      case "reply":
        await toggleReplyLike({
          commentReplyId: input.commentReplyId,
          userId,
        });
        break;
    }
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

async function togglePostLike({
  postId,
  userId,
}: WithUserId<PostLikeParams>): Promise<void> {
  // Verify post exists
  const postResults = await db
    .select({
      postId: posts.id,
      postTitle: posts.title,
      postOwnerId: posts.userId,
      ownerUsername: users.username,
      ownerImageUrl: users.imageUrl,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, postId));

  const postWithOwner = postResults[0];
  if (!postWithOwner) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Post not found",
    });
  }

  // Check if like already exists
  const [existingLike] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

  let isLiked: boolean;

  if (existingLike) {
    // Remove like
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    isLiked = false;
  } else {
    // Add like
    const [newLike] = await db
      .insert(likes)
      .values({
        userId,
        postId,
      })
      .returning();

    isLiked = true;

    // Create notification for post owner (if not liking own post)
    if (newLike && postWithOwner.postOwnerId !== userId) {
      try {
        await createNotification({
          recipientId: postWithOwner.postOwnerId,
          actorId: userId,
          type: "like",
          postId: postId,
          likeId: newLike.id,
        });
      } catch (notificationError) {
        console.error("Failed to create like notification:", notificationError);
      }
    }
  }

  // Get updated like count and publish real-time update
  try {
    const [likeCount] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.postId, postId));

    const channelName = `likes:post:${postId}`;
    await ably.channels.get(channelName).publish("like_update", {
      type: "post_like_toggled",
      postId,
      userId,
      isLiked,
      count: likeCount?.count ?? 0,
      timestamp: new Date(),
    });

    console.log(`✅ Published post like update to channel: ${channelName}`, {
      postId,
      userId,
      isLiked,
      count: likeCount?.count ?? 0,
    });
  } catch (ablyError) {
    console.error("❌ Failed to publish post like update to Ably:", ablyError);
    // Don't throw error, like was still toggled successfully
  }
}

async function toggleCommentLike({
  commentId,
  userId,
}: WithUserId<CommentLikeParams>): Promise<void> {
  // Verify comment exists
  const commentResults = await db
    .select({
      commentId: comments.id,
      commentText: comments.text,
      commentOwnerId: comments.userId,
      ownerUsername: users.username,
      ownerImageUrl: users.imageUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, commentId));

  const commentWithOwner = commentResults[0];
  if (!commentWithOwner) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Comment not found",
    });
  }

  // Check if like already exists
  const [existingLike] = await db
    .select()
    .from(commentLikes)
    .where(
      and(
        eq(commentLikes.userId, userId),
        eq(commentLikes.commentId, commentId),
      ),
    );

  let isLiked: boolean;

  if (existingLike) {
    // Remove like
    await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.userId, userId),
          eq(commentLikes.commentId, commentId),
        ),
      );
    isLiked = false;
  } else {
    // Add like
    const [newLike] = await db
      .insert(commentLikes)
      .values({
        userId,
        commentId,
      })
      .returning();

    isLiked = true;

    // Create notification for comment owner (if not liking own comment)
    if (newLike && commentWithOwner.commentOwnerId !== userId) {
      try {
        await createNotification({
          recipientId: commentWithOwner.commentOwnerId,
          actorId: userId,
          type: "comment_like",
          commentId: commentId,
          commentLikeId: newLike.id,
        });
      } catch (notificationError) {
        console.error(
          "Failed to create comment like notification:",
          notificationError,
        );
      }
    }
  }

  // Get updated like count and publish real-time update
  try {
    const [likeCount] = await db
      .select({ count: count() })
      .from(commentLikes)
      .where(eq(commentLikes.commentId, commentId));

    const channelName = `likes:comment:${commentId}`;
    await ably.channels.get(channelName).publish("like_update", {
      type: "comment_like_toggled",
      commentId,
      userId,
      isLiked,
      count: likeCount?.count ?? 0,
      timestamp: new Date(),
    });

    console.log(`✅ Published comment like update to channel: ${channelName}`, {
      commentId,
      userId,
      isLiked,
      count: likeCount?.count ?? 0,
    });
  } catch (ablyError) {
    console.error(
      "❌ Failed to publish comment like update to Ably:",
      ablyError,
    );
    // Don't throw error, like was still toggled successfully
  }
}

async function toggleReplyLike({
  commentReplyId,
  userId,
}: WithUserId<ReplyLikeParams>): Promise<void> {
  // Verify comment reply exists
  const commentReplyResults = await db
    .select({
      commentReplyId: commentReplies.id,
      commentReplyText: commentReplies.text,
      commentReplyOwnerId: commentReplies.userId,
      ownerUsername: users.username,
      ownerImageUrl: users.imageUrl,
    })
    .from(commentReplies)
    .innerJoin(users, eq(commentReplies.userId, users.id))
    .where(eq(commentReplies.id, commentReplyId));

  const commentReplyWithOwner = commentReplyResults[0];
  if (!commentReplyWithOwner) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Comment reply not found",
    });
  }

  // Check if like already exists
  const [existingLike] = await db
    .select()
    .from(commentReplyLikes)
    .where(
      and(
        eq(commentReplyLikes.userId, userId),
        eq(commentReplyLikes.commentReplyId, commentReplyId),
      ),
    );

  let isLiked: boolean;

  if (existingLike) {
    // Remove like
    await db
      .delete(commentReplyLikes)
      .where(
        and(
          eq(commentReplyLikes.userId, userId),
          eq(commentReplyLikes.commentReplyId, commentReplyId),
        ),
      );
    isLiked = false;
  } else {
    // Add like
    const [newLike] = await db
      .insert(commentReplyLikes)
      .values({
        userId,
        commentReplyId,
      })
      .returning();

    isLiked = true;

    // Create notification for reply owner (if not liking own reply)
    if (newLike && commentReplyWithOwner.commentReplyOwnerId !== userId) {
      try {
        await createNotification({
          recipientId: commentReplyWithOwner.commentReplyOwnerId,
          actorId: userId,
          type: "reply_like",
          replyId: commentReplyId,
          commentReplyLikeId: newLike.id,
        });
      } catch (notificationError) {
        console.error(
          "Failed to create reply like notification:",
          notificationError,
        );
      }
    }
  }

  // Get updated like count and publish real-time update
  try {
    const [likeCount] = await db
      .select({ count: count() })
      .from(commentReplyLikes)
      .where(eq(commentReplyLikes.commentReplyId, commentReplyId));

    const channelName = `likes:reply:${commentReplyId}`;
    await ably.channels.get(channelName).publish("like_update", {
      type: "reply_like_toggled",
      commentReplyId,
      userId,
      isLiked,
      count: likeCount?.count ?? 0,
      timestamp: new Date(),
    });

    console.log(`✅ Published reply like update to channel: ${channelName}`, {
      commentReplyId,
      userId,
      isLiked,
      count: likeCount?.count ?? 0,
    });
  } catch (ablyError) {
    console.error("❌ Failed to publish reply like update to Ably:", ablyError);
    // Don't throw error, like was still toggled successfully
  }
}
