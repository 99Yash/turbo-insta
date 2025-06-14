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

  const sidebarBreakpoint = pathname.startsWith("/messages") ? "sm" : "xl";
  const defaultOpen = pathname.startsWith("/messages") ? false : undefined;

  // Always provide sidebar context to avoid context errors
  // Individual pages handle their own authentication redirects
  return (
    <SidebarContainer breakpoint={sidebarBreakpoint} defaultOpen={defaultOpen}>
      {isLoaded && user && isSignedIn ? (
        <>
          <AppSidebar />
          {children}
        </>
      ) : // Show loading or render children without sidebar for unauthenticated states
      // Pages will handle redirects appropriately
      isLoaded ? (
        children
      ) : (
        <div>Loading...</div>
      )}
    </SidebarContainer>
  );
}
