import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { HydrateClient } from "~/trpc/server";
import { Create } from "./_components/forms/create";
import { InfinitePosts } from "./_components/infinite-posts";
import { ResponsiveSidebarLayout } from "./_components/responsive-sidebar-layout";

export default async function Home() {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <ResponsiveSidebarLayout user={user} maxWidth="max-w-[470px]">
      <HydrateClient>
        <div className="flex flex-col py-8 pb-24 lg:pb-8">
          {user && <Create />}
          <InfinitePosts />
        </div>
      </HydrateClient>
    </ResponsiveSidebarLayout>
  );
}
