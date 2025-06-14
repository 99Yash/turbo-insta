/**
 * Mobile sidebar trigger button with consistent styling and accessibility
 */
"use client";

import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { useSidebar } from "~/components/ui/sidebar";

interface MobileSidebarTriggerProps {
  /**
   * Custom trigger content. If not provided, uses default hamburger menu icon
   */
  children?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function MobileSidebarTrigger({
  children,
  className,
}: MobileSidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={`h-9 w-9 hover:bg-accent ${className ?? ""}`}
      aria-label="Toggle sidebar"
    >
      {children ?? <Icons.menu className="h-5 w-5" />}
    </Button>
  );
}
