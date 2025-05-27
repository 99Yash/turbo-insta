"use client";

import { useEffect, useState } from "react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { useMediaQuery } from "~/hooks/use-media-query";
import { type User } from "~/server/db/schema";
import { AppSidebar } from "./app-sidebar";

interface SidebarLayoutProps {
  user: User;
  children: React.ReactNode;
  /**
   * Layout variant:
   * - "centered": Centers content with max-width constraint (for feeds, posts)
   * - "full-width": Uses full width layout (for profiles)
   */
  variant?: "centered" | "full-width";
  /**
   * Max width class for centered variant (e.g., "max-w-[470px]")
   * Only applies when variant is "centered"
   */
  width?: `w-[${string}px]`;
}

function SidebarLayoutContent({
  user,
  children,
  variant = "centered",
  width = "w-[670px]",
}: SidebarLayoutProps) {
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
          {variant === "centered" ? (
            <div className={`mx-auto ${width} p-4`}>{children}</div>
          ) : (
            <div className="w-full">{children}</div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "full-width") {
    // Desktop full-width layout (for profiles)
    return (
      <div className="mx-auto flex h-full w-full max-w-screen-lg">
        <AppSidebar user={user} />
        <div className="min-w-0 flex-1 bg-background">
          <div className="w-full">{children}</div>
        </div>
      </div>
    );
  }

  // Desktop centered layout (for feeds, posts)
  return (
    <div className="relative h-full min-h-screen w-full">
      <AppSidebar user={user} />
      {/* Content positioned to center on entire viewport */}
      <div
        className="absolute inset-0 flex items-start justify-center bg-background"
        style={{ left: 0 }}
      >
        <div className={`${width} p-4`}>{children}</div>
      </div>
    </div>
  );
}

export function SidebarLayout({
  user,
  children,
  variant = "centered",
  width = "w-[670px]",
}: SidebarLayoutProps) {
  const isXlAndAbove = useMediaQuery("(min-width: 1280px)");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Automatically collapse sidebar when screen is smaller than xl
  useEffect(() => {
    setSidebarOpen(isXlAndAbove);
  }, [isXlAndAbove]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SidebarLayoutContent user={user} variant={variant} width={width}>
        {children}
      </SidebarLayoutContent>
    </SidebarProvider>
  );
}
