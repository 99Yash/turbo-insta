"use client";

import { useAuth } from "@clerk/nextjs";
import Ably from "ably";
import { AblyProvider } from "ably/react";

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
    closeOnUnload: false,
    clientId: userId,
  });

export const AblyContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId } = useAuth();
  if (!userId) {
    return <>{children}</>;
  }
  return <AblyProvider client={ablyClient(userId)}>{children}</AblyProvider>;
};
