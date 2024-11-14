import { currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

export const getCachedUser = cache(currentUser);
