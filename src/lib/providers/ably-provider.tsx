"use client";

import * as Ably from "ably";
import { AblyProvider } from "ably/react";

const ablyClient = new Ably.Realtime({
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
});

export const AblyContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <AblyProvider client={ablyClient}>{children}</AblyProvider>;
};
