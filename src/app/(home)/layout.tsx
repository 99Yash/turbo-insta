"use client";

import { useUser } from "@clerk/nextjs";
import { SidebarLayout } from "./_components/sidebar/sidebar-layout";

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
    <SidebarLayout variant="centered" width="w-[470px]">
      {children}
    </SidebarLayout>
  );
}
