import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { ably } from "~/lib/ably";
import { DISALLOWED_USERNAMES } from "~/lib/utils";
import { db } from "~/server/db";
import { follows, users } from "~/server/db/schema/users";

/**
 * Find a user by their ID
 * @param id The user's primary ID
 * @returns The user object or throws an error if not found
 */
export async function getUserById(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Find a user by their username
 * @param username The user's username
 * @returns The user object or throws an error if not found
 */
export async function getUserByUsername(username: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Find a user by their email
 * @param email The user's email
 * @returns The user object or throws an error if not found
 */
export async function getUserByEmail(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get multiple users by their IDs
 * @param ids Array of user IDs
 * @returns Array of user objects (only returns found users)
 */
export async function getUsersByIds(ids: string[]) {
  try {
    // Use 'in' operator for querying multiple IDs
    const foundUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, ids));

    return foundUsers;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Update a user's profile
 * @param userId The user's ID
 * @param data The updated profile data
 * @returns The updated user object
 */
export async function updateUserProfile(
  userId: string,
  data: {
    name: string;
    username: string;
    bio: string | null;
    imageUrl: string | null;
  },
) {
  try {
    // Check if the username is already taken by another user
    if (data.username) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, data.username),
      });

      if (existingUser && existingUser.id !== userId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username is already taken",
        });
      }

      if (DISALLOWED_USERNAMES.includes(data.username)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username is not allowed",
        });
      }
    }

    // Update the user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        name: data.name,
        username: data.username,
        bio: data.bio,
        imageUrl: data.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return updatedUser;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getFollowers(userId: string) {
  try {
    const followers = await db.query.follows.findMany({
      where: eq(follows.followingId, userId),
    });

    return followers;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getFollowing(userId: string) {
  try {
    const following = await db.query.follows.findMany({
      where: eq(follows.followerId, userId),
    });

    return following;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Check if one user is following another
 * @param followerId The ID of the potential follower
 * @param targetUserId The ID of the potential target
 * @returns Boolean indicating if the follow relationship exists
 */
export async function isFollowing(
  followerId: string,
  targetUserId: string,
): Promise<boolean> {
  try {
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, targetUserId),
        ),
      );

    return !!existingFollow;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Toggle follow status between two users
 * @param followerId The ID of the user who wants to follow/unfollow
 * @param targetUserId The ID of the user to be followed/unfollowed
 * @returns Object indicating the action taken and current follow status
 */
export async function toggleFollow(
  followerId: string,
  targetUserId: string,
): Promise<{ action: "followed" | "unfollowed"; isFollowing: boolean }> {
  try {
    // Edge case 1: User cannot follow themselves
    if (followerId === targetUserId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot follow yourself",
      });
    }

    // Edge case 2: Verify both users exist
    const [followerUser, targetUser] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, followerId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, targetUserId),
      }),
    ]);

    if (!followerUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Follower user not found",
      });
    }

    if (!targetUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Target user not found",
      });
    }

    // Check if follow relationship already exists
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, targetUserId),
        ),
      );

    if (existingFollow) {
      // Unfollow: Remove the follow relationship
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, targetUserId),
          ),
        );

      return {
        action: "unfollowed",
        isFollowing: false,
      };
    } else {
      // Follow: Create the follow relationship
      try {
        await db.insert(follows).values({
          followerId,
          followingId: targetUserId,
        });

        return {
          action: "followed",
          isFollowing: true,
        };
      } catch (insertError) {
        // Handle race condition where another request created the follow relationship
        // Check if it's a unique constraint violation
        if (
          insertError instanceof Error &&
          insertError.message.includes("unique_follow_relation")
        ) {
          // The follow relationship was created by another request, return followed status
          return {
            action: "followed",
            isFollowing: true,
          };
        }
        // Re-throw other errors
        throw insertError;
      }
    }
  } catch (e) {
    // Don't wrap already wrapped TRPC errors
    if (e instanceof TRPCError) {
      throw e;
    }

    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Get users by username or name with enhanced search
 * @param query The search query to match against username or name
 * @param limitCount The maximum number of results to return
 * @returns Array of matching users
 */
export async function getUsersByUsername(query: string, limitCount = 5) {
  try {
    const searchResults = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageUrl: users.imageUrl,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.name, `%${query}%`),
        ),
      )
      .limit(limitCount)
      .orderBy(users.username);

    return searchResults;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

/**
 * Search users by username or name with pagination support
 * @param query The search query to match against username or name
 * @param offset The number of results to skip
 * @param size The maximum number of results to return
 * @returns Array of matching users
 */
export async function searchUsers(query: string, offset: number, size: number) {
  try {
    const searchResults = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageUrl: users.imageUrl,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(
        query.trim() === ""
          ? undefined // Return all users if no query
          : or(
              ilike(users.username, `%${query}%`),
              ilike(users.name, `%${query}%`),
            ),
      )
      .offset(offset)
      .limit(size)
      .orderBy(users.username);

    return searchResults;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}

export async function getAblyToken(userId: string) {
  try {
    const token = await ably.auth.createTokenRequest({
      clientId: userId,
    });
    console.log(">>>>>>>TOKEN", token);
    return token;
  } catch (e) {
    throw new TRPCError({
      code: getTRPCErrorFromUnknown(e).code,
      message: getTRPCErrorFromUnknown(e).message,
    });
  }
}
