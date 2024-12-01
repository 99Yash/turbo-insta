import { currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { getCachedClerkClient } from "./clerk";

export const getCachedUser = cache(currentUser);
export const users = await (await getCachedClerkClient()).users.getUserList();
