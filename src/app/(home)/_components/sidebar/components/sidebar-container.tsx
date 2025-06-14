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

  // Initialize sidebar state based on defaultOpen or responsive behavior
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    return defaultOpen ?? isAboveBreakpoint;
  });

  // Update sidebar state when breakpoint changes (responsive behavior)
  // Only apply responsive behavior if no explicit defaultOpen was provided
  React.useEffect(() => {
    if (defaultOpen === undefined) {
      setSidebarOpen(isAboveBreakpoint);
    }
  }, [isAboveBreakpoint, defaultOpen]);

  // Handle sidebar state changes from user interactions
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setSidebarOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleOpenChange}>
      {children}
    </SidebarProvider>
  );
}
