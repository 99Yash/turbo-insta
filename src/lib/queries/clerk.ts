import { clerkClient } from "@clerk/nextjs/server";
import { cache } from "react";

export const getCachedClerkClient = cache(clerkClient);
