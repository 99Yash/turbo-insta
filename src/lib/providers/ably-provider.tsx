"use client";

import { useAuth } from "@clerk/nextjs";
import * as Ably from "ably";
import { AblyProvider as AblyProviderBase } from "ably/react";
import * as React from "react";
import { api } from "~/trpc/react";

function useAblyClient() {
  const { userId } = useAuth();
  const utils = api.useUtils();

  return React.useMemo(() => {
    if (!userId) return;

    const ablyClient = new Ably.Realtime({
      authCallback: (_tokenParams, callback) => {
        utils.user.getAblyToken
          .fetch()
          .then((tokenData) => callback(null, tokenData.token))
          .catch((error) => callback(error as Ably.ErrorInfo, null));
      },
      /**
       * Auto-connect in the browser because we don't have cookies in the next-server
       * and we don't want ably to fire authCallback without cookies
       * @see https://github.com/ably/ably-js/issues/1742
       */
      autoConnect: typeof window !== "undefined",
      closeOnUnload: false,
    });

    return ablyClient;
  }, [userId, utils]);
}

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const ablyClient = useAblyClient();
  if (!ablyClient) return <>{children}</>;

  return <AblyProviderBase client={ablyClient}>{children}</AblyProviderBase>;
}
