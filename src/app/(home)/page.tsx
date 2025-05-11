import { currentUser } from "@clerk/nextjs/server";
import { api, HydrateClient } from "~/trpc/server";
import { Create } from "./_components/forms/create";
import { Post } from "./_components/post";

export default async function Home() {
  const { items: posts } = await api.posts.getAll({
    limit: 10,
  });

  const user = await currentUser();

  return (
    <HydrateClient>
      <div className="flex flex-col py-8 pb-24 lg:pb-8">
        {user && <Create />}
        <div className="space-y-6">
          {posts.map((post) => {
            if (!post.users) return null;
            return (
              <Post key={post.posts.id} post={post.posts} author={post.users} />
            );
          })}
        </div>
      </div>
    </HydrateClient>
  );
}
