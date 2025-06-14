/**
 * High-level sidebar layout component that composes sidebar container with content layouts.
 * This is the main component that applications should use.
 *
 * Design Philosophy:
 * - Generic and reusable - no page-specific assumptions
 * - Composable - can be used with different content layouts
 * - Configurable via props - not convenience components
 * - Focused on sidebar behavior and layout patterns
 */
"use client";

import * as React from "react";
import { AppSidebar } from "../app-sidebar";
import {
  AbsoluteCenteredLayout,
  CenteredLayout,
  FullWidthLayout,
} from "./layout-wrapper";
import { SidebarContainer } from "./sidebar-container";

interface SidebarLayoutProps {
  children: React.ReactNode;
  /**
   * Layout strategy for content
   */
  layout?: "centered" | "full-width" | "absolute-centered";
  /**
   * Width/max-width for content area
   */
  contentWidth?: string;
  /**
   * Responsive breakpoint for sidebar behavior
   */
  sidebarBreakpoint?: "xl" | "sm";
  /**
   * Mobile breakpoint for layout behavior
   */
  mobileBreakpoint?: "sm" | "md";
  /**
   * Initial sidebar state
   */
  defaultSidebarOpen?: boolean;
  /**
   * Show mobile trigger on mobile devices
   */
  showMobileTrigger?: boolean;
  /**
   * Sidebar variant - controls how the sidebar behaves
   * - "default": Normal responsive behavior
   * - "minimized": Start minimized, good for content-focused pages
   * - "persistent": Always try to stay open when possible
   */
  sidebarVariant?: "default" | "minimized" | "persistent";
  /**
   * Called when sidebar state changes
   */
  onSidebarChange?: (open: boolean) => void;
}

export function SidebarLayout({
  children,
  layout = "centered",
  contentWidth,
  sidebarBreakpoint = "xl",
  mobileBreakpoint = "sm",
  defaultSidebarOpen,
  showMobileTrigger = true,
  sidebarVariant = "default",
  onSidebarChange,
}: SidebarLayoutProps) {
  const renderContent = () => {
    switch (layout) {
      case "full-width":
        return (
          <FullWidthLayout
            showMobileTrigger={showMobileTrigger}
            mobileBreakpoint={mobileBreakpoint}
          >
            {children}
          </FullWidthLayout>
        );

      case "absolute-centered":
        return (
          <AbsoluteCenteredLayout
            width={contentWidth ?? "w-[470px]"}
            showMobileTrigger={showMobileTrigger}
            mobileBreakpoint={mobileBreakpoint}
          >
            {children}
          </AbsoluteCenteredLayout>
        );

      case "centered":
      default:
        return (
          <CenteredLayout
            maxWidth={contentWidth ?? "max-w-[470px]"}
            showMobileTrigger={showMobileTrigger}
            mobileBreakpoint={mobileBreakpoint}
          >
            {children}
          </CenteredLayout>
        );
    }
  };

  const computedDefaultOpen = React.useMemo(() => {
    if (defaultSidebarOpen !== undefined) return defaultSidebarOpen;

    switch (sidebarVariant) {
      case "minimized":
        return false;
      case "persistent":
        return true;
      case "default":
      default:
        return undefined; // Let SidebarContainer handle responsive behavior
    }
  }, [defaultSidebarOpen, sidebarVariant]);

  return (
    <SidebarContainer
      breakpoint={sidebarBreakpoint}
      defaultOpen={computedDefaultOpen}
      onOpenChange={onSidebarChange}
    >
      <AppSidebar />
      {renderContent()}
    </SidebarContainer>
  );
}
