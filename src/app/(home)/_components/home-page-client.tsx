"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import Link from "next/link";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { siteConfig } from "~/config/site";
import { useUser as useDbUser } from "~/contexts/user-context";
import { Create } from "./forms/create";
import { InfinitePosts } from "./infinite-posts";
import { CenteredLayout } from "./sidebar/components";

function UnauthenticatedBanner() {
  return (
    <div className="mb-6 rounded-lg border border-border bg-muted/30 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icons.logo className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">
        Welcome to {siteConfig.name}!
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Join our community to create posts, like, comment, and connect with
        others.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild size="sm">
          <Link href="/signup">Sign Up</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/signin">Sign In</Link>
        </Button>
      </div>
    </div>
  );
}

export function HomePageClient() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const { user: dbUser, isLoading: isDbUserLoading } = useDbUser();

  // Show loading if Clerk is loading or if we're fetching database user for authenticated users
  if (!clerkLoaded || (clerkUser && !dbUser && isDbUserLoading)) {
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

  const isAuthenticated = clerkUser && dbUser;

  return (
    <CenteredLayout maxWidth="max-w-[470px]">
      <div className="flex flex-col py-8 pb-24 lg:pb-8">
        {!isAuthenticated && <UnauthenticatedBanner />}
        {isAuthenticated && <Create />}
        <InfinitePosts />
      </div>
    </CenteredLayout>
  );
}
