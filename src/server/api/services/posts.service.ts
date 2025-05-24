import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { and, count, desc, eq, gt, lt, or } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { generateAltText } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { comments, likes, posts, users } from "~/server/db/schema";
import {
  type CreatePostInput,
  type GetPostByIdInput,
  type getPostByIdSchema,
  type GetPostsByUserIdInput,
  type GetPostsInput,
} from "../schema/posts.schema";
import { type WithOptionalUser, type WithUser } from "../schema/user.schema";

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

export const deletePost = async (input: WithUser<typeof getPostByIdSchema>) => {
  try {
    const { postId, userId } = input;

    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)));

    if (!post) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
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

export async function getPostsByUserId(input: GetPostsByUserIdInput) {
  const { userId, limit, cursor } = input;

  try {
    const items = await db
      .select()
      .from(posts)
      .where(
        cursor
          ? and(
              eq(posts.userId, userId),
              or(
                gt(posts.createdAt, cursor.createdAt),
                and(
                  eq(posts.createdAt, cursor.createdAt),
                  gt(posts.id, cursor.id),
                ),
              ),
            )
          : eq(posts.userId, userId),
      )
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1);

    let nextCursor: typeof cursor | undefined = undefined;

    if (items.length > limit) {
      const nextItem = items.pop()!;
      nextCursor = {
        id: nextItem.id,
        createdAt: nextItem.createdAt,
      };
    }

    return {
      items,
      nextCursor,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export const getUserTopPosts = async (userId: string) => {
  try {
    const postsWithLikes = await db
      .select({
        post: posts,
        likeCount: count(likes.id),
      })
      .from(posts)
      .leftJoin(likes, eq(posts.id, likes.postId))
      .where(eq(posts.userId, userId))
      .groupBy(posts.id)
      .orderBy(desc(count(likes.id)), desc(posts.createdAt))
      .limit(3);

    return postsWithLikes;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
};

export const getPosts = async (input: GetPostsInput) => {
  const limit = 8;
  const { cursor } = input;

  try {
    const items = await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(
        cursor
          ? or(
              lt(posts.createdAt, cursor.createdAt),
              and(
                eq(posts.createdAt, cursor.createdAt),
                lt(posts.id, cursor.id),
              ),
            )
          : undefined,
      )
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1);

    let nextCursor: typeof cursor | undefined = undefined;

    if (items.length > limit) {
      items.pop();

      const lastReturnedItem = items[items.length - 1]!;
      nextCursor = {
        id: lastReturnedItem.posts.id,
        createdAt: lastReturnedItem.posts.createdAt,
      };
    }

    return {
      items,
      nextCursor,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
};

export async function getPostLikes(
  input: WithOptionalUser<typeof getPostByIdSchema>,
) {
  const { postId, userId } = input;

  try {
    const [c] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.postId, postId));

    if (userId) {
      const [likedPost] = await db
        .select({
          id: likes.id,
        })
        .from(likes)
        .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

      return {
        count: c?.count ?? 0,
        hasLiked: !!likedPost,
      };
    }

    return {
      count: c?.count ?? 0,
      hasLiked: false,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getPostById(input: GetPostByIdInput) {
  const { postId } = input;

  try {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    return post;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getPostComments(input: GetPostByIdInput) {
  const { postId } = input;

  try {
    const postComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId));

    return postComments;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
