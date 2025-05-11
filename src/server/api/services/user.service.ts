import { TRPCError, getTRPCErrorFromUnknown } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

/**
 * Find a user by their ID
 * @param id The user's primary ID
 * @returns The user object or throws an error if not found
 */
export const getUserById = async (id: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
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
};

/**
 * Find a user by their username
 * @param username The user's username
 * @returns The user object or throws an error if not found
 */
export const getUserByUsername = async (username: string) => {
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
};

/**
 * Find a user by their email
 * @param email The user's email
 * @returns The user object or throws an error if not found
 */
export const getUserByEmail = async (email: string) => {
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
};

/**
 * Get multiple users by their IDs
 * @param ids Array of user IDs
 * @returns Array of user objects (only returns found users)
 */
export const getUsersByIds = async (ids: string[]) => {
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
};
