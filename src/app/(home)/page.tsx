import { users } from "~/lib/queries/user";
import { api, HydrateClient } from "~/trpc/server";
import { Post } from "./components/post";

export default async function Home() {
  const posts = await api.posts.getAll({
    limit: 10,
  });

  return (
    <HydrateClient>
      <main className="mt-12 flex flex-col items-center justify-center">
        {posts.items.map((post) => {
          const author = users.find((user) => user.id === post.userId);
          if (!author) return null;

          return <Post key={post.id} post={post} author={author} />;
        })}
      </main>
    </HydrateClient>
  );
}
