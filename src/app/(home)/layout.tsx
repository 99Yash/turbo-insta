"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { SidebarContainer } from "./_components/sidebar/components";

function HomeLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar Skeleton */}
      <div className="bg-sidebar-background flex h-full w-[280px] flex-col border-r border-border/40 px-4 py-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2 px-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Search/Command */}
        <div className="mb-4">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Navigation Group */}
        <div className="mb-4">
          <Skeleton className="mb-2 h-4 w-20" />
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Separator */}
        <Skeleton className="mb-4 h-px w-full" />

        {/* Secondary Group */}
        <div className="mb-6">
          <Skeleton className="mb-2 h-4 w-16" />
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="min-w-0 flex-1 bg-background">
        <div className="flex justify-center">
          <div className="w-full max-w-[470px] p-4">
            <div className="space-y-6">
              {/* Header area */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="size-8 rounded-full" />
              </div>

              {/* Post skeletons */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <div className="space-y-2">
                    <div className="flex gap-4">
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
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
    <SidebarContainer breakpoint={sidebarBreakpoint} defaultOpen={defaultOpen}>
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
  );
}
