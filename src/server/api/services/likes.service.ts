import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, eq } from "drizzle-orm";
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
import { type ToggleLikeInput } from "../schema/likes.schema";

type ToggleLikeWithUser = ToggleLikeInput & { userId: string };

export async function toggleLike(input: ToggleLikeWithUser): Promise<void> {
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
        await toggleCommentReplyLike({
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
}: {
  postId: string;
  userId: string;
}): Promise<void> {
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

  if (existingLike) {
    // Remove like
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  } else {
    // Add like
    await db.insert(likes).values({
      userId,
      postId,
    });
  }
}

async function toggleCommentLike({
  commentId,
  userId,
}: {
  commentId: string;
  userId: string;
}): Promise<void> {
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
  } else {
    // Add like
    await db.insert(commentLikes).values({
      userId,
      commentId,
    });
  }
}

async function toggleCommentReplyLike({
  commentReplyId,
  userId,
}: {
  commentReplyId: string;
  userId: string;
}): Promise<void> {
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
  } else {
    // Add like
    await db.insert(commentReplyLikes).values({
      userId,
      commentReplyId,
    });
  }
}
