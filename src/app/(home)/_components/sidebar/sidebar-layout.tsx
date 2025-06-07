"use client";

import * as React from "react";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { useMediaQuery } from "~/hooks/use-media-query";
import { AppSidebar } from "./app-sidebar";

interface SidebarLayoutProps {
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
  /**
   * Force sidebar to start minimized for screens above sm breakpoint
   * Useful for pages like messages where you want more space
   */
  forceMinimized?: boolean;
}

function SidebarLayoutContent({
  children,
  variant = "centered",
  width = "w-[670px]",
  forceMinimized = false,
}: SidebarLayoutProps) {
  const { isMobile, toggleSidebar } = useSidebar();
  const isSmAndAbove = useMediaQuery("(min-width: 640px)");
  const isSmAndBelow = !isSmAndAbove;

  // Use custom mobile breakpoint for forceMinimized pages
  const shouldShowMobileLayout = forceMinimized ? isSmAndBelow : isMobile;

  if (shouldShowMobileLayout) {
    // On mobile, sidebar is an overlay with trigger button at top
    return (
      <div className="flex h-full min-h-screen w-full">
        <AppSidebar />
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
        <AppSidebar />
        <div className="min-w-0 flex-1 bg-background">
          <div className="w-full">{children}</div>
        </div>
      </div>
    );
  }

  // Desktop centered layout (for feeds, posts)
  return (
    <div className="relative h-full min-h-screen w-full">
      <AppSidebar />
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
  children,
  variant = "centered",
  width = "w-[670px]",
  forceMinimized = false,
}: SidebarLayoutProps) {
  const isXlAndAbove = useMediaQuery("(min-width: 1280px)");
  const isSmAndAbove = useMediaQuery("(min-width: 640px)");
  const [sidebarOpen, setSidebarOpen] = React.useState(!forceMinimized);

  React.useEffect(() => {
    const shouldOpen = forceMinimized
      ? !isSmAndAbove // For forceMinimized: only open on mobile (below sm)
      : isXlAndAbove; // Default: only open on desktop (xl and above)

    setSidebarOpen(shouldOpen);
  }, [isXlAndAbove, isSmAndAbove, forceMinimized]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SidebarLayoutContent
        variant={variant}
        width={width}
        forceMinimized={forceMinimized}
      >
        {children}
      </SidebarLayoutContent>
    </SidebarProvider>
  );
}
