import { currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { getCachedClerkClient } from "./clerk";

export const getCachedUser = cache(currentUser);
export const { data: users, totalCount: usersCount } = await (
  await getCachedClerkClient()
).users.getUserList();
