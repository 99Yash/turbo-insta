import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { likes } from "~/server/db/schema";
import { type toggleLikeSchema } from "../schema/likes.schema";
import { type WithUser } from "../schema/user.schema";

export async function toggleLike(input: WithUser<typeof toggleLikeSchema>) {
  const { postId, userId } = input;
  try {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    if (existingLike) {
      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    } else {
      await db.insert(likes).values({
        userId,
        postId,
      });
    }
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
