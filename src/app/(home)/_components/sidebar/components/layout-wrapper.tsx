/**
 * Layout wrapper components that handle different content layout patterns.
 * These components focus purely on layout without sidebar concerns.
 */
"use client";

import * as React from "react";
import { useSidebar } from "~/components/ui/sidebar";
import { useMediaQuery } from "~/hooks/use-media-query";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";

interface BaseLayoutProps {
  children: React.ReactNode;
  /**
   * Show mobile trigger bar at top on mobile
   */
  showMobileTrigger?: boolean;
  /**
   * Custom breakpoint for mobile behavior
   */
  mobileBreakpoint?: "sm" | "md";
}

/**
 * Centered layout with max width constraint.
 * Good for feeds, posts, and focused content.
 */
interface CenteredLayoutProps extends BaseLayoutProps {
  /**
   * Max width constraint (e.g., "max-w-[470px]")
   */
  maxWidth?: string;
}

export function CenteredLayout({
  children,
  maxWidth = "max-w-[470px]",
  showMobileTrigger = true,
  mobileBreakpoint = "sm",
}: CenteredLayoutProps) {
  const { isMobile } = useSidebar();
  const isCustomMobile = useMediaQuery(
    mobileBreakpoint === "sm" ? "(max-width: 639px)" : "(max-width: 767px)",
  );

  const shouldShowMobileTrigger =
    showMobileTrigger && (isMobile || isCustomMobile);

  return (
    <div className="flex h-full min-h-screen w-full">
      <div className="min-w-0 flex-1 bg-background">
        {shouldShowMobileTrigger && (
          <div className="sticky top-0 z-40 flex items-center justify-start border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <MobileSidebarTrigger />
          </div>
        )}
        <div className="flex justify-center">
          <div className={`w-full ${maxWidth} p-4`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full width layout.
 * Good for profiles, dashboards, and content that needs space.
 */
export function FullWidthLayout({
  children,
  showMobileTrigger = true,
  mobileBreakpoint = "sm",
}: BaseLayoutProps) {
  const { isMobile } = useSidebar();
  const isCustomMobile = useMediaQuery(
    mobileBreakpoint === "sm" ? "(max-width: 639px)" : "(max-width: 767px)",
  );

  const shouldShowMobileTrigger =
    showMobileTrigger && (isMobile || isCustomMobile);

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-lg">
      <div className="min-w-0 flex-1 bg-background">
        {shouldShowMobileTrigger && (
          <div className="sticky top-0 z-40 flex items-center justify-start border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <MobileSidebarTrigger />
          </div>
        )}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

/**
 * Absolutely positioned centered layout.
 * Good for overlaying content on top of sidebars.
 */
interface AbsoluteCenteredLayoutProps extends BaseLayoutProps {
  /**
   * Width constraint (e.g., "w-[470px]")
   */
  width?: string;
}

export function AbsoluteCenteredLayout({
  children,
  width = "w-[470px]",
  showMobileTrigger = true,
  mobileBreakpoint = "sm",
}: AbsoluteCenteredLayoutProps) {
  const { isMobile } = useSidebar();
  const isCustomMobile = useMediaQuery(
    mobileBreakpoint === "sm" ? "(max-width: 639px)" : "(max-width: 767px)",
  );

  const shouldShowMobileTrigger =
    showMobileTrigger && (isMobile || isCustomMobile);

  if (shouldShowMobileTrigger) {
    // On mobile, use normal flow layout
    return (
      <div className="flex h-full min-h-screen w-full">
        <div className="min-w-0 flex-1 bg-background">
          <div className="sticky top-0 z-40 flex items-center justify-start border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <MobileSidebarTrigger />
          </div>
          <div className="flex justify-center">
            <div className={`w-full max-w-[470px] p-4`}>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  // On desktop, use flex layout to center on viewport (avoiding absolute positioning issues)
  return (
    <div className="flex h-full min-h-screen w-full">
      <div className="min-w-0 flex-1 bg-background">
        <div className="flex justify-center">
          <div
            className={`w-full ${width.startsWith("w-[") ? width.replace("w-[", "max-w-[") : `max-w-[${width}]`} p-4`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
