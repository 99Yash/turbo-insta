"use client";

import { useUser } from "@clerk/nextjs";
import Ably from "ably";
import { AblyProvider } from "ably/react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

let ablyClient: Ably.Realtime | null = null;

export const AblyContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoaded } = useUser();
  const [client, setClient] = useState<Ably.Realtime | null>(null);

  const {
    data: tokenData,
    isLoading: tokenLoading,
    error: tokenError,
  } = api.utils.getSocketAuthToken.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id },
  );

  // Debug logging for auth state
  useEffect(() => {
    console.log("AblyProvider debug:", {
      userLoaded: isLoaded,
      userId: user?.id,
      hasTokenData: !!tokenData,
      tokenLoading,
      tokenError: tokenError?.message,
      hasClient: !!client,
    });
  }, [isLoaded, user?.id, tokenData, tokenLoading, tokenError, client]);

  useEffect(() => {
    if (!user?.id || !tokenData) {
      console.log("Not creating Ably client - missing user or token data");
      return;
    }

    // Don't create a new client if we already have one for this user
    if (ablyClient?.auth.clientId === user.id) {
      console.log("Reusing existing Ably client for user:", user.id);
      setClient(ablyClient);
      return;
    }

    console.log("Creating new Ably client for user:", user.id);

    // Clean up previous client
    if (ablyClient) {
      console.log("Closing previous Ably client");
      ablyClient.close();
    }

    try {
      // Create new client with proper auth
      const newClient = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          console.log("Ably auth callback called");
          callback(null, tokenData);
        },
        autoConnect: true,
        closeOnUnload: false,
      });

      ablyClient = newClient;
      setClient(newClient);
    } catch (error) {
      console.error("Error creating Ably client:", error);
    }

    return () => {
      // Don't close on unmount as we want to keep the connection
      // It will be closed when a new user logs in or the app is closed
    };
  }, [user?.id, tokenData]);

  // Only render the provider when we have a proper client
  // This prevents the useChannel hook from being called with an invalid client
  if (!client) {
    console.log("Ably client not ready, rendering children without provider");
    return <>{children}</>;
  }

  return <AblyProvider client={client}>{children}</AblyProvider>;
};
