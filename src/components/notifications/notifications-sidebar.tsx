"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { SidebarNotifications } from "./sidebar-notifications";

interface NotificationsSidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly unreadCount: number;
}

export function NotificationsSidebar({
  isOpen,
  onClose,
  unreadCount,
}: NotificationsSidebarProps) {
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        id="notifications-sidebar"
        className={cn(
          "fixed right-0 top-0 z-50 h-full bg-sidebar shadow-xl transition-transform duration-300 ease-out",
          "w-full max-w-md border-l border-border/40 sm:w-96",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-sidebar-title"
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-3 border-b border-border/40 p-4 transition-all duration-500 ease-out",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
          style={{ transitionDelay: isOpen ? "100ms" : "0ms" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 transition-colors hover:bg-muted"
            aria-label="Close notifications"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2
            id="notifications-sidebar-title"
            className="text-lg font-semibold text-sidebar-foreground"
          >
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="ml-auto rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "h-[calc(100%-5rem)] overflow-hidden p-4 transition-all duration-500 ease-out",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: isOpen ? "200ms" : "0ms" }}
        >
          <SidebarNotifications unreadCount={unreadCount} />
        </div>
      </div>
    </>
  );
}
