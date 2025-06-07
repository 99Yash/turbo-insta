"use client";

import { AblyProvider } from "ably/react";
import { useAblyClient } from "~/hooks/use-ably";

interface AblyProviderWrapperProps {
  readonly children: React.ReactNode;
}

export function AblyProviderWrapper({ children }: AblyProviderWrapperProps) {
  const ablyClient = useAblyClient();

  // If no client is available (user not authenticated), render children without AblyProvider
  if (!ablyClient) {
    return <>{children}</>;
  }

  return <AblyProvider client={ablyClient}>{children}</AblyProvider>;
}
