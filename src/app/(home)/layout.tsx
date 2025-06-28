"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as React from "react";
import { LoadingState, SidebarLoading } from "~/components/ui/loading";
import {
  ErrorBoundary,
  LoadingErrorFallback,
} from "~/components/utils/error-boundary";
import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { SidebarContainer } from "./_components/sidebar/components/sidebar-container";

function HomeLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Responsive Sidebar - Hidden on mobile, shown on xl+ screens */}
      <SidebarLoading className="hidden xl:flex" />

      {/* Enhanced Main content with creative loading animation */}
      <div className="flex-1">
        <LoadingState
          title="Setting up your experience..."
          description="Getting everything ready for you"
          variant="center"
          spinnerVariant="breathe"
          className="h-full"
          responsive={true}
        />
      </div>
    </div>
  );
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const [showSkeleton, setShowSkeleton] = React.useState(true);

  // Show skeleton for maximum 3 seconds, then always show content
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 3000);

    // Hide skeleton immediately if loaded
    if (isLoaded) {
      setShowSkeleton(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [isLoaded]);

  const sidebarBreakpoint = pathname.startsWith("/messages") ? "sm" : "xl";
  const defaultOpen = pathname.startsWith("/messages") ? false : undefined;

  return (
    <ErrorBoundary fallback={LoadingErrorFallback}>
      <SidebarContainer
        breakpoint={sidebarBreakpoint}
        defaultOpen={defaultOpen}
      >
        {showSkeleton ? (
          <HomeLayoutSkeleton />
        ) : isLoaded && user && isSignedIn ? (
          <>
            <AppSidebar />
            {children}
          </>
        ) : (
          children
        )}
      </SidebarContainer>
    </ErrorBoundary>
  );
}
