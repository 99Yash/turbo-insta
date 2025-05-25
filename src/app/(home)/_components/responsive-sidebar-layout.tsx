"use client";

import { useEffect, useState } from "react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { useMediaQuery } from "~/hooks/use-media-query";
import { type User } from "~/server/db/schema";
import { AppSidebar } from "./app-sidebar";

interface ResponsiveSidebarLayoutProps {
  user: User;
  children: React.ReactNode;
  maxWidth?: string;
}

function SidebarLayoutContent({
  user,
  children,
  maxWidth = "max-w-[670px]",
}: ResponsiveSidebarLayoutProps) {
  const { isMobile, toggleSidebar } = useSidebar();

  if (isMobile) {
    // On mobile, sidebar is an overlay with trigger button at top
    return (
      <div className="flex h-full min-h-screen w-full">
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
          <div className={`mx-auto ${maxWidth} p-4`}>{children}</div>
        </div>
      </div>
    );
  }

  // On desktop, use absolute positioning to center on entire viewport
  return (
    <div className="relative h-full min-h-screen w-full">
      <AppSidebar user={user} />
      {/* Content positioned to center on entire viewport */}
      <div
        className="absolute inset-0 flex items-start justify-center bg-background"
        style={{ left: 0 }}
      >
        <div className={`${maxWidth} p-4`}>{children}</div>
      </div>
    </div>
  );
}

export function ResponsiveSidebarLayout({
  user,
  children,
  maxWidth = "max-w-[670px]",
}: ResponsiveSidebarLayoutProps) {
  const isXlAndAbove = useMediaQuery("(min-width: 1280px)");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Automatically collapse sidebar when screen is smaller than xl
  useEffect(() => {
    setSidebarOpen(isXlAndAbove);
  }, [isXlAndAbove]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SidebarLayoutContent user={user} maxWidth={maxWidth}>
        {children}
      </SidebarLayoutContent>
    </SidebarProvider>
  );
}
