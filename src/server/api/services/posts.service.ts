import { getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { and, count, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { generateAltText } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { bookmarks, comments, likes, posts, users } from "~/server/db/schema";
import {
  type CreatePostInput,
  type EditPostInput,
  type getBookmarkStatusSchema,
  type GetPostByIdInput,
  type getPostByIdSchema,
  type GetPostsByUserIdInput,
  type GetPostsInput,
  type GetUserBookmarksInput,
  type ToggleBookmarkInput,
} from "../schema/posts.schema";
import {
  type WithOptionalUser,
  type WithUser,
  type WithUserId,
} from "../schema/user.schema";

export const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

export async function createPost(input: CreatePostInput, userId: string) {
  try {
    await Promise.all(
      input.files.map(async (file) => {
        // Generate alt text only if not provided
        if (!file.alt) {
          try {
            const description = await generateAltText(file.url);
            file.alt = description;
          } catch (error) {
            console.error(
              `Failed to generate alt text for ${file.name}:`,
              error,
            );
            // More specific error logging for timeout issues
            if (error instanceof Error && error.name === "TimeoutError") {
              console.error(
                `Alt text generation timed out for ${file.name}, using filename as fallback`,
              );
            }
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
}

export async function editPost(input: WithUserId<EditPostInput>) {
  try {
    // First, get the existing post to verify ownership and get current images for comparison
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, input.postId));

    if (!existingPost) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    if (existingPost.userId !== input.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only edit your own posts",
      });
    }

    // Compare existing images with new images to find which ones to delete
    const existingImageIds = new Set(existingPost.images.map((img) => img.id));
    const newImageIds = new Set(input.files.map((file) => file.id));

    // Find images that need to be deleted (exist in current but not in new)
    const imagesToDelete = existingPost.images.filter(
      (img) => !newImageIds.has(img.id),
    );

    // Only delete images that are no longer needed
    if (imagesToDelete.length > 0) {
      console.log(
        `Deleting ${imagesToDelete.length} unused images:`,
        imagesToDelete.map((img) => img.id),
      );
      await Promise.all(
        imagesToDelete.map((image) =>
          utapi.deleteFiles(image.id).catch((err) => {
            console.error(`Failed to delete file ${image.id}:`, err);
          }),
        ),
      );
    }

    // Generate alt text for new files that don't have it
    // (Only process files that don't already exist in the post)
    const newFiles = input.files.filter(
      (file) => !existingImageIds.has(file.id),
    );

    if (newFiles.length > 0) {
      console.log(`Generating alt text for ${newFiles.length} new images`);
      await Promise.all(
        newFiles.map(async (file) => {
          // Generate alt text only if not provided
          if (!file.alt) {
            try {
              const description = await generateAltText(file.url);
              file.alt = description;
            } catch (error) {
              console.error(
                `Failed to generate alt text for ${file.name}:`,
                error,
              );
              // More specific error logging for timeout issues
              if (error instanceof Error && error.name === "TimeoutError") {
                console.error(
                  `Alt text generation timed out for ${file.name}, using filename as fallback`,
                );
              }
              file.alt = file.name; // Fallback to using the filename as alt text
            }
          }
        }),
      );
    }

    // Update the post with new images array (includes both kept and new images)
    const [updatedPost] = await db
      .update(posts)
      .set({
        title: input.title,
        images: input.files.map((file) => ({
          id: file.id,
          url: file.url,
          name: file.name,
          alt: file.alt,
        })),
      })
      .where(eq(posts.id, input.postId))
      .returning();

    if (!updatedPost) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update post",
      });
    }

    console.log(`Post ${input.postId} updated successfully`);
    return updatedPost;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function deletePost(input: WithUser<typeof getPostByIdSchema>) {
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
}

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

export async function getUserTopPosts(userId: string) {
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
}

export async function getPosts(input: GetPostsInput) {
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
}

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

export async function toggleBookmark(
  input: ToggleBookmarkInput,
  userId: string,
) {
  const { postId } = input;

  try {
    const [existingBookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));

    if (existingBookmark) {
      await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
      return { bookmarked: false };
    } else {
      await db.insert(bookmarks).values({
        postId,
        userId,
      });
      return { bookmarked: true };
    }
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getBookmarkStatus(
  input: WithUser<typeof getBookmarkStatusSchema>,
) {
  const { postId, userId } = input;

  try {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));

    return { isBookmarked: !!bookmark };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getUserBookmarks(
  input: GetUserBookmarksInput,
  userId: string,
) {
  const { limit, cursor } = input;

  try {
    const items = await db
      .select({
        bookmark: bookmarks,
        post: posts,
        user: users,
      })
      .from(bookmarks)
      .leftJoin(posts, eq(bookmarks.postId, posts.id))
      .leftJoin(users, eq(posts.userId, users.id))
      .where(
        cursor
          ? and(
              eq(bookmarks.userId, userId),
              or(
                gt(bookmarks.createdAt, cursor.createdAt),
                and(
                  eq(bookmarks.createdAt, cursor.createdAt),
                  gt(bookmarks.id, cursor.id),
                ),
              ),
            )
          : eq(bookmarks.userId, userId),
      )
      .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
      .limit(limit + 1);

    // Get post IDs for engagement data
    const postIds = items
      .map((item) => item.post?.id)
      .filter((id): id is string => !!id);

    // Get like counts for each post
    const likeCounts =
      postIds.length > 0
        ? await db
            .select({
              postId: likes.postId,
              count: count(),
            })
            .from(likes)
            .where(inArray(likes.postId, postIds))
            .groupBy(likes.postId)
        : [];

    // Get comment counts for each post
    const commentCounts =
      postIds.length > 0
        ? await db
            .select({
              postId: comments.postId,
              count: count(),
            })
            .from(comments)
            .where(inArray(comments.postId, postIds))
            .groupBy(comments.postId)
        : [];

    // Add engagement data to items
    const itemsWithEngagement = items.map((item) => {
      if (!item.post) return item;

      const likeCount =
        likeCounts.find((lc) => lc.postId === item.post!.id)?.count ?? 0;
      const commentCount =
        commentCounts.find((cc) => cc.postId === item.post!.id)?.count ?? 0;

      return {
        ...item,
        post: {
          ...item.post,
          likeCount,
          commentCount,
        },
      };
    });

    let nextCursor: typeof cursor | undefined = undefined;

    if (itemsWithEngagement.length > limit) {
      const nextItem = itemsWithEngagement.pop()!;
      nextCursor = {
        id: nextItem.bookmark.id,
        createdAt: nextItem.bookmark.createdAt,
      };
    }

    return {
      items: itemsWithEngagement,
      nextCursor,
    };
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
