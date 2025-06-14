import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import * as React from "react";
import { getUserById } from "~/server/api/services/user.service";

/**
 * Get the user from the database
 * @returns The user or null if the user is not found
 */
export const getCachedUser = React.cache(async () => {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const user = await getUserById(clerkUser.id);
  if (!user) {
    return null;
  }

  return user;
});
