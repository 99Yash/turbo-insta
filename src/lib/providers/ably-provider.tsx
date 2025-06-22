"use client";

import { useAuth } from "@clerk/nextjs";
import Ably from "ably";
import { AblyProvider } from "ably/react";
import * as React from "react";

const ablyClient = (userId: string) =>
  new Ably.Realtime({
    authCallback: (_data, callback) => {
      fetch("/api/ably")
        .then((response) => response.json())
        .then((data) => callback(null, data as Ably.TokenRequest))
        .catch((error) => callback(error as Ably.ErrorInfo | string, null));
    },
    /**
     * Auto-connect in the browser because we don't have cookies in the next-server
     * and we don't want ably to fire authCallback without cookies
     * @see https://github.com/ably/ably-js/issues/1742
     */
    autoConnect: typeof window !== "undefined",
    closeOnUnload: true, // immediate disconnect on page unload
    clientId: userId,
    transportParams: {
      heartbeatInterval: 15000, // 15 seconds instead of default 30s for faster disconnect detection
      remainPresentFor: 5000, // 5 seconds before removing from presence set after disconnect
    },
    disconnectedRetryTimeout: 1000, // Retry connection faster
    suspendedRetryTimeout: 2000, // Retry when suspended faster
  });

export const AblyContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId } = useAuth();

  const client = React.useMemo(() => {
    if (!userId) return null;
    return ablyClient(userId);
  }, [userId]);

  if (!client) {
    return <>{children}</>;
  }

  return <AblyProvider client={client}>{children}</AblyProvider>;
};
