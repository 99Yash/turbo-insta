import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { describeImage } from "~/lib/utils";
import { db } from "~/server/db";
import { posts } from "~/server/db/schema";
import { type CreatePostInput } from "../validators/posts.schema";

export const createPost = async (input: CreatePostInput, userId: string) => {
  try {
    await Promise.all(
      input.files.map(async (file) => {
        const description = await describeImage(file.url);
        file.alt = description;

        console.log(description);
      }),
    );

    const [post] = await db
      .insert(posts)
      .values({
        title: input.title,
        userId,
        images: input.files.map((file) => ({
          id: file.id,
          url: file.url,
          name: file.name,
          alt: file.alt,
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
