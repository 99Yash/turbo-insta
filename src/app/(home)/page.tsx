import { currentUser } from "@clerk/nextjs/server";
import { Create } from "~/components/forms/create";
import { users } from "~/lib/queries/user";
import { api, HydrateClient } from "~/trpc/server";
import { Post } from "./components/post";

export default async function Home() {
  const posts = await api.posts.getAll({
    limit: 10,
  });

  const user = await currentUser();

  return (
    <HydrateClient>
      <main className="mt-12 flex flex-col items-center justify-center">
        {user && <Create />}
        {posts.items.map((post) => {
          const author = users.find((user) => user.id === post.userId);
          if (!author) return null;

          return <Post key={post.id} post={post} author={author} />;
        })}
      </main>
    </HydrateClient>
  );
}
