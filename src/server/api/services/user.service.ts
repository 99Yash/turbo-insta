import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

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
