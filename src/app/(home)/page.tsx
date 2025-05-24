import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { HydrateClient } from "~/trpc/server";
import { AppSidebar } from "./_components/app-sidebar";
import { Create } from "./_components/forms/create";
import { InfinitePosts } from "./_components/infinite-posts";

export default async function Home() {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="flex h-full">
      <div className="fixed left-0 top-0 z-20 h-full border-r border-border">
        <AppSidebar user={user} />
      </div>
      <div className="flex-1">
        <div className="mx-auto max-w-[470px]">
          <HydrateClient>
            <div className="flex flex-col py-8 pb-24 lg:pb-8">
              {user && <Create />}
              <InfinitePosts />
            </div>
          </HydrateClient>
        </div>
      </div>
    </div>
  );
}
