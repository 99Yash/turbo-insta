"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { SidebarContainer } from "./_components/sidebar/components";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  if (!user || !isLoaded || !isSignedIn) {
    return null;
  }

  // Provide sidebar container for shared state (websockets, etc.)
  // but let individual layouts handle their own content layout
  const sidebarBreakpoint = pathname.startsWith("/messages") ? "sm" : "xl";
  const defaultOpen = pathname.startsWith("/messages") ? false : undefined;

  return (
    <SidebarContainer breakpoint={sidebarBreakpoint} defaultOpen={defaultOpen}>
      <AppSidebar />
      {children}
    </SidebarContainer>
  );
}
