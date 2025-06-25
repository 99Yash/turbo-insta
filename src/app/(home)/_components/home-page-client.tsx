"use client";

import { useUser } from "~/contexts/user-context";
import { Create } from "./forms/create";
import { InfinitePosts } from "./infinite-posts";
import { CenteredLayout } from "./sidebar/components";

export function HomePageClient() {
  const { user, isLoading } = useUser();

  if (isLoading || !user) {
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
