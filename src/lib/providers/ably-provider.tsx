"use client";

import Ably from "ably";
import { AblyProvider } from "ably/react";
import { env } from "~/env";

export function AblyContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ablyClient = new Ably.Realtime({
    authUrl: `${env.NEXT_PUBLIC_APP_URL}/api/trpc/utils.getSocketAuthToken`,
    // authCallback: (_tokenParams, callback) => {
    //   const { data: tokenResponse, error } =
    //     api.utils.getSocketAuthToken.useQuery(undefined, {
    //       enabled: typeof window !== "undefined",
    //     });

    //   if (error) {
    //     return callback(error.message, null);
    //   }

    //   if (!tokenResponse) {
    //     return callback("No data", null);
    //   }

    //   callback(null, tokenResponse);
    // },
    /**
     * Auto-connect in the browser because we don't have cookies in the next-server
     * and we don't want ably to fire authCallback without cookies
     * @see https://github.com/ably/ably-js/issues/1742
     */
    autoConnect: typeof window !== "undefined",
    closeOnUnload: false,
  });

  return <AblyProvider client={ablyClient}>{children}</AblyProvider>;
}
