import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { generateAltText } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { posts } from "~/server/db/schema";
import { type CreatePostInput } from "../validators/posts.schema";

export const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

export const createPost = async (input: CreatePostInput, userId: string) => {
  try {
    await Promise.all(
      input.files.map(async (file) => {
        if (!file.alt) {
          try {
            const description = await generateAltText(file.url);
            file.alt = description;
          } catch (error) {
            console.error("Failed to generate alt text:", error);
            file.alt = file.name; // Fallback to using the filename as alt text
          }
        }
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

export const deletePost = async (postId: string, userId: string) => {
  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)));

    if (!post) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Post not found or you don't have permission to delete it",
      });
    }

    await db.delete(posts).where(eq(posts.id, postId));

    await Promise.all(
      post.images.map((image) =>
        utapi.deleteFiles(image.id).catch((err) => {
          console.error(`Failed to delete file ${image.id}:`, err);
        }),
      ),
    );
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
};
