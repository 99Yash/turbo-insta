"use client";

import { useAuth } from "@clerk/nextjs";
import * as Ably from "ably";
import { AblyProvider as AblyProviderBase } from "ably/react";
import * as React from "react";
import { api } from "~/trpc/react";

function useAblyClient() {
  const { userId } = useAuth();
  const { data: tokenData } = api.user.getAblyToken.useQuery(undefined, {
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  return React.useMemo(() => {
    if (!userId || !tokenData?.token) return;

    const ablyClient = new Ably.Realtime({
      authCallback(data, callback) {
        callback(null, tokenData.token);
      },
      autoConnect: typeof window !== "undefined",
      closeOnUnload: false,
    });

    return ablyClient;
  }, [userId, tokenData]);
}

/**
 * Create a private channel name for two users
 * @param userId1 - The ID of the first user
 * @param userId2 - The ID of the second user
 * @returns The private channel name
 */
export function createPrivateChannelName(userId1: string, userId2: string) {
  // Sort the IDs to ensure consistent channel name regardless of who initiates
  const sortedIds = [userId1, userId2].sort();
  return `private:${sortedIds[0]}:${sortedIds[1]}`;
}

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const ablyClient = useAblyClient();
  if (!ablyClient) return <>{children}</>;

  return <AblyProviderBase client={ablyClient}>{children}</AblyProviderBase>;
}
