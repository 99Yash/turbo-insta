import { useUser } from "@clerk/nextjs";
import { ChannelProvider } from "ably/react";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <ChannelProvider channelName={`notifications:${user.id}`}>
      {children}
    </ChannelProvider>
  );
}
