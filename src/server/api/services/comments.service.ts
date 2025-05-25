import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "~/server/db";
import { comments, users } from "~/server/db/schema";
import {
  type GetCommentsInput,
  type createCommentSchema,
  type deleteCommentSchema,
} from "../schema/comments.schema";
import { type WithUser } from "../schema/user.schema";

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

    return comment;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getComments(input: GetCommentsInput) {
  try {
    const { postId, cursor } = input;
    const limit = 10;

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

    const commentsWithUser = postComments.map((comment) => {
      const user = authors.find((u) => u.id === comment.userId);
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
