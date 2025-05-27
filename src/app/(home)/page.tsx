import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { HydrateClient } from "~/trpc/server";
import { Create } from "./_components/forms/create";
import { InfinitePosts } from "./_components/infinite-posts";
import { SidebarLayout } from "./_components/sidebar/sidebar-layout";

export default async function Home() {
  const user = await getCachedUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <SidebarLayout user={user} variant="centered" maxWidth="w-[470px]">
      <HydrateClient>
        <div className="flex flex-col py-8 pb-24 lg:pb-8">
          {user && <Create />}
          <InfinitePosts />
        </div>
      </HydrateClient>
    </SidebarLayout>
  );
}
