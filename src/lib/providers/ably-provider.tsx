"use client";

import * as Ably from "ably";
import { AblyProvider } from "ably/react";

/**
 * Obtain an Ably token request from our tRPC endpoint
 * @returns Promise that resolves to an Ably TokenRequest
 */
async function obtainTokenRequest(): Promise<Ably.TokenRequest> {
  // Make direct fetch request to our tRPC endpoint
  const response = await fetch("/api/trpc/user.getAblyToken", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Type the tRPC response structure
  const data = (await response.json()) as {
    result?: {
      data?: {
        token?: Ably.TokenRequest;
      };
    };
  };

  // tRPC wraps the response in a result object
  const tokenRequest = data.result?.data?.token;

  if (!tokenRequest) {
    throw new Error("No token received from server");
  }

  return tokenRequest;
}

// Create the Ably client outside the component to ensure it's stable
// and doesn't get recreated on every render
const ablyClient = new Ably.Realtime({
  authCallback: (_tokenParams, callback) => {
    // Use void to handle the async operation without returning a promise
    void (async () => {
      let tokenRequest: Ably.TokenRequest;
      try {
        tokenRequest = await obtainTokenRequest();
      } catch (err) {
        console.error("Ably auth error:", err);
        callback(err as Ably.ErrorInfo | string, null);
        return;
      }
      callback(null, tokenRequest);
    })();
  },
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
