/**
 * Base sidebar container that handles responsive behavior and state management.
 * This is a foundational component that other sidebar implementations can build upon.
 */
"use client";

import * as React from "react";
import { SidebarProvider } from "~/components/ui/sidebar";
import { useMediaQuery } from "~/hooks/use-media-query";

interface SidebarContainerProps {
  children: React.ReactNode;
  /**
   * Initial open state. Defaults to responsive behavior:
   * - Desktop (xl+): open
   * - Mobile: closed
   */
  defaultOpen?: boolean;
  /**
   * Breakpoint for responsive behavior.
   * - "xl": Changes at 1280px (default)
   * - "sm": Changes at 640px (for components that need more space)
   */
  breakpoint?: "xl" | "sm";
  /**
   * Called when sidebar open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

export function SidebarContainer({
  children,
  defaultOpen,
  breakpoint = "xl",
  onOpenChange,
}: SidebarContainerProps) {
  const isAboveBreakpoint = useMediaQuery(
    breakpoint === "xl" ? "(min-width: 1280px)" : "(min-width: 640px)",
  );

  // Compute the default open state based on breakpoint if not explicitly provided
  const computedDefaultOpen = React.useMemo(() => {
    return defaultOpen ?? isAboveBreakpoint;
  }, [defaultOpen, isAboveBreakpoint]);

  return (
    <SidebarProvider
      defaultOpen={computedDefaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </SidebarProvider>
  );
}
