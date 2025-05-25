"use client";

import { useEffect, useState } from "react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { useMediaQuery } from "~/hooks/use-media-query";
import { type User } from "~/server/db/schema";
import { AppSidebar } from "./app-sidebar";

interface ProfileSidebarLayoutProps {
  user: User;
  children: React.ReactNode;
}

function ProfileSidebarLayoutContent({
  user,
  children,
}: ProfileSidebarLayoutProps) {
  const { isMobile, toggleSidebar } = useSidebar();

  if (isMobile) {
    // On mobile, sidebar is an overlay with trigger button at top
    return (
      <div className="mx-auto flex h-full min-h-screen w-full">
        <AppSidebar user={user} />
        <div className="min-w-0 flex-1 bg-background">
          {/* Mobile trigger button positioned at top */}
          <div className="sticky top-0 z-40 flex items-center justify-start border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-9 w-9 hover:bg-accent"
              aria-label="Toggle sidebar"
            >
              <Icons.menu className="h-5 w-5" />
            </Button>
          </div>
          {/* No width constraint on mobile for profiles */}
          <div className="w-full">{children}</div>
        </div>
      </div>
    );
  }

  // On desktop, use flex layout to account for sidebar width
  return (
    <div className="mx-auto flex h-full w-full max-w-screen-lg">
      <AppSidebar user={user} />
      {/* Content takes remaining width */}
      <div className="min-w-0 flex-1 bg-background">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

export function ProfileSidebarLayout({
  user,
  children,
}: ProfileSidebarLayoutProps) {
  const isXlAndAbove = useMediaQuery("(min-width: 1280px)");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Automatically collapse sidebar when screen is smaller than xl
  useEffect(() => {
    setSidebarOpen(isXlAndAbove);
  }, [isXlAndAbove]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <ProfileSidebarLayoutContent user={user}>
        {children}
      </ProfileSidebarLayoutContent>
    </SidebarProvider>
  );
}
