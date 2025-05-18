import { redirect } from "next/navigation";
import { getCachedUser } from "~/lib/queries/user";
import { api, HydrateClient } from "~/trpc/server";
import { AppSidebar } from "./_components/app-sidebar";
import { Create } from "./_components/forms/create";
import { Post } from "./_components/post";

export default async function Home() {
  const { items: posts } = await api.posts.getAll({
    limit: 10,
  });

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
              <div className="space-y-6">
                {posts.map((post) => {
                  if (!post.users) return null;
                  return (
                    <Post
                      key={post.posts.id}
                      post={post.posts}
                      author={post.users}
                    />
                  );
                })}
              </div>
            </div>
          </HydrateClient>
        </div>
      </div>
    </div>
  );
}
