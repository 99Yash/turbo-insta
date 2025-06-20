"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { FullWidthLayout } from "../_components/sidebar/components";

function ProfileLayoutSkeleton() {
  return (
    <FullWidthLayout>
      <div className="mx-auto w-full max-w-[800px]">
        <div className="space-y-8 p-6">
          {/* Profile Header Skeleton */}
          <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-8">
            <Skeleton className="size-24 rounded-full md:size-36 lg:size-40" />

            <div className="mt-4 flex w-full flex-1 flex-col md:mt-0">
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-7 w-40" />

                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </div>

              <div className="mt-4 flex space-x-6">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>

          {/* Profile Tabs Skeleton */}
          <div className="border-t pt-6">
            <div className="flex justify-center">
              <div className="flex space-x-6">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>

            {/* Posts Grid Skeleton */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </FullWidthLayout>
  );
}

export default function ProfileLayout({ children }: React.PropsWithChildren) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoaded && (!user || !isSignedIn)) {
      router.replace("/signin");
    }
  }, [user, isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <ProfileLayoutSkeleton />;
  }

  if (!user || !isSignedIn) {
    return null;
  }

  return (
    <FullWidthLayout>
      <div className="mx-auto w-full max-w-[800px]">{children}</div>
    </FullWidthLayout>
  );
}
