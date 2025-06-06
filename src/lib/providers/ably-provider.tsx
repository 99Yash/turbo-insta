"use client";

import { auth } from "@clerk/nextjs/server";
import * as Ably from "ably";
import { api } from "~/trpc/react";

export async function getAblyClient() {
  const { userId } = await auth();
  if (!userId) return;

  const realtimeClient = new Ably.Realtime({
    clientId: userId,
    authCallback: (tokenParams, callback) => {
      const { data } = api.user.getAblyToken.useQuery(undefined, {
        refetchOnWindowFocus: false,
      });
      if (!data) return;
      callback(null, data.token);
    },
  });

  return realtimeClient;
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

export async function getPrivateChannel(userId1: string, userId2: string) {
  const ablyClient = await getAblyClient();
  if (!ablyClient) return;

  const channelName = createPrivateChannelName(userId1, userId2);
  const channel = ablyClient.channels.get(channelName); // the `get` method creates or retrieves the channel instance
  return channel;
}
