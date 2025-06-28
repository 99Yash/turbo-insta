"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { Icons } from "~/components/icons";
import { useUser as useDbUser } from "~/contexts/user-context";
import { Create } from "./forms/create";
import { InfinitePosts } from "./infinite-posts";
import { CenteredLayout } from "./sidebar/components";

export function HomePageClient() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const { user: dbUser, isLoading: isDbUserLoading } = useDbUser();

  // Show loading if Clerk is loading or if we're fetching database user
  if (!clerkLoaded || (!dbUser && isDbUserLoading)) {
    return (
      <CenteredLayout maxWidth="max-w-[470px]">
        <div className="flex flex-col items-center justify-center py-16">
          <Icons.spinner className="size-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading your profile...
          </p>
        </div>
      </CenteredLayout>
    );
  }

  // If Clerk user exists but no database user and not loading, something went wrong
  if (clerkUser && !dbUser && !isDbUserLoading) {
    return (
      <CenteredLayout maxWidth="max-w-[470px]">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">
            Having trouble loading your profile. Please refresh the page.
          </p>
        </div>
      </CenteredLayout>
    );
  }

  if (!clerkUser || !dbUser) {
    return null;
  }

  return (
    <CenteredLayout maxWidth="max-w-[470px]">
      <div className="flex flex-col py-8 pb-24 lg:pb-8">
        <Create />
        <InfinitePosts />
      </div>
    </CenteredLayout>
  );
}
