import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { getUserById } from "~/server/api/services/user.service";

export const getCachedUser = cache(async () => {
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
