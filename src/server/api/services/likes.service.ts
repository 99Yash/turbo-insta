import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { likes, posts, users } from "~/server/db/schema";
import { type toggleLikeSchema } from "../schema/likes.schema";
import { type WithUser } from "../schema/user.schema";
import { publishLikeNotification } from "./notifications.service";

export async function toggleLike(input: WithUser<typeof toggleLikeSchema>) {
  const { postId, userId } = input;
  try {
    // First, get the post and user information for notifications
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

    // Get the user who is liking/unliking
    const userResults = await db
      .select({
        id: users.id,
        username: users.username,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(eq(users.id, userId));

    const likingUser = userResults[0];
    if (!likingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if like already exists
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    const isLiking = !existingLike;

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

    // Send notification only if someone else is liking the post (not the owner)
    if (postWithOwner.postOwnerId !== userId) {
      await publishLikeNotification({
        type: "like",
        postId,
        postOwnerId: postWithOwner.postOwnerId,
        likedByUserId: likingUser.id,
        likedByUsername: likingUser.username,
        likedByImageUrl: likingUser.imageUrl ?? undefined,
        postTitle: postWithOwner.postTitle ?? undefined,
        action: isLiking ? "added" : "removed",
      });
    }

    return { success: true, isLiked: isLiking };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
