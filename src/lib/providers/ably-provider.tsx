"use client";

import { useAuth } from "@clerk/nextjs";
import * as Ably from "ably";
import { AblyProvider as AblyProviderBase } from "ably/react";
import * as React from "react";
import { api } from "~/trpc/react";

function useAblyClient() {
  const { userId } = useAuth();
  const tokenQuery = api.user.getAblyToken.useQuery(undefined, {
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  const refetchTokenRef = React.useRef(tokenQuery.refetch);
  const [ablyClient, setAblyClient] = React.useState<
    Ably.Realtime | undefined
  >();

  // Update refetch ref when it changes
  React.useEffect(() => {
    refetchTokenRef.current = tokenQuery.refetch;
  }, [tokenQuery.refetch]);

  React.useEffect(() => {
    if (!userId || !tokenQuery.data?.token) {
      setAblyClient(undefined);
      return;
    }

    const client = new Ably.Realtime({
      authCallback(data, callback) {
        // Use refetch function to get fresh token instead of stale closure
        refetchTokenRef
          .current()
          .then((result) => {
            if (result.data?.token) {
              callback(null, result.data.token);
            } else {
              callback("Failed to get fresh token", null);
            }
          })
          .catch((error) => {
            callback(
              error instanceof Error ? error.message : "Authentication error",
              null,
            );
          });
      },
      autoConnect: typeof window !== "undefined",
      closeOnUnload: false,
    });

    setAblyClient(client);

    // Cleanup: close the previous client when effect runs again or component unmounts
    return () => {
      client.close();
    };
  }, [userId, tokenQuery.data?.token]);

  return ablyClient;
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
