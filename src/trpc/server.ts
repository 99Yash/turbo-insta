import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";

import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import React from "react";
import { getBaseUrl } from "~/lib/utils";
import { createCaller, type AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = React.cache(async () => {
  const req = new NextRequest(getBaseUrl(), { headers: await headers() });
  const heads = new Headers(req.headers);
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
    auth: getAuth(req),
  });
});

const getQueryClient = React.cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
