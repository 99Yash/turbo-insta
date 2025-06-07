"use client";

import * as Ably from "ably";
import { AblyProvider } from "ably/react";

// Create the Ably client outside the component to ensure it's stable
// and doesn't get recreated on every render
const ablyClient = new Ably.Realtime({
  authUrl: "/api/ably",
  /**
   * Auto-connect in the browser because we don't have cookies in the next-server
   * and we don't want ably to fire authCallback without cookies
   * @see https://github.com/ably/ably-js/issues/1742
   */
  autoConnect: typeof window !== "undefined",
  closeOnUnload: false,
});

interface AblyProviderProps {
  readonly children: React.ReactNode;
}

export function AblyContextProvider({ children }: AblyProviderProps) {
  return <AblyProvider client={ablyClient}>{children}</AblyProvider>;
}
