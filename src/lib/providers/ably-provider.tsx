"use client";

import { useAuth } from "@clerk/nextjs";
import Ably from "ably";
import * as React from "react";
import { useMounted } from "~/hooks/use-mounted";

// Create our own Ably context
const AblyContext = React.createContext<Ably.Realtime | null>(null);

export const AblyContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isMounted = useMounted();
  const { userId, isLoaded } = useAuth();
  const [ablyClient, setAblyClient] = React.useState<Ably.Realtime | null>(
    null,
  );

  console.log("AblyContextProvider render:", {
    isMounted,
    isLoaded,
    userId: !!userId,
    hasClient: !!ablyClient,
  });

  React.useEffect(() => {
    console.log("AblyContextProvider useEffect triggered:", {
      isMounted,
      isLoaded,
      userId: !!userId,
    });

    // Only proceed when mounted, auth is loaded, and we have a user
    if (!isMounted || !isLoaded || !userId) {
      console.log("AblyContextProvider: Not ready, skipping client creation");
      return;
    }

    console.log("AblyContextProvider: Creating client...");

    const createClient = async () => {
      try {
        console.log("AblyContextProvider: Starting client creation");
        const client = new Ably.Realtime({
          authUrl: "/api/ably",
          autoConnect: true,
          closeOnUnload: true,
          clientId: userId,
        });

        console.log("AblyContextProvider: Client created successfully", client);
        setAblyClient(client);
      } catch (error) {
        console.error("Failed to create Ably client:", error);
      }
    };

    void createClient();

    return () => {
      console.log("AblyContextProvider: Cleaning up client");
      setAblyClient((prevClient) => {
        if (prevClient) {
          prevClient.close();
        }
        return null;
      });
    };
  }, [isMounted, isLoaded, userId]);

  return (
    <AblyContext.Provider value={ablyClient}>{children}</AblyContext.Provider>
  );
};

// Custom hook to use Ably client
export const useAbly = (): Ably.Realtime | null => {
  const client = React.useContext(AblyContext);
  console.log("useAbly called, client:", !!client);
  return client;
};
