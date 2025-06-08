"use client";

import { useUser } from "@clerk/nextjs";
import { ChannelProvider } from "ably/react";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!user || !isLoaded || !isSignedIn) {
    return <>{children}</>;
  }

  return (
    <ChannelProvider channelName={`notifications:${user.id}`}>
      {children}
    </ChannelProvider>
  );
}
