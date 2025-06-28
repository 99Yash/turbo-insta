"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Icons } from "~/components/icons";
import { Skeleton } from "~/components/ui/skeleton";
import {
  ErrorBoundary,
  LoadingErrorFallback,
} from "~/components/utils/error-boundary";
import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { SidebarContainer } from "./_components/sidebar/components/sidebar-container";

function HomeLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="w-80 border-r border-border/40 bg-background">
        <div className="flex h-16 items-center gap-2 border-b border-border/40 px-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1">
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
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
