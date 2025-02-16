import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { posts } from "~/server/db/schema";
import { type CreatePostInput } from "../schema/posts.schema";

export const createPost = async (input: CreatePostInput) => {
  try {
    const [post] = await db
      .insert(posts)
      .values({
        title: input.title,
        userId: input.userId,
        images: input.files.map((file) => ({
          url: file.url,
          name: file.name,
          id: file.id,
        })),
      })
      .returning();

    if (!post)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create post",
      });
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
};
