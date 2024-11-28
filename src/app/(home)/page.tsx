import Image from "next/image";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const posts = await api.post.getAll();

  return (
    <HydrateClient>
      <main className="flex flex-col items-center justify-center">
        {posts.map((post) => (
          <div key={post.id} className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <Image
              width={300}
              height={300}
              className="rounded-md"
              src={post.images[0]?.url ?? `/images/image.png`}
              alt={`${post.title} image`}
            />
          </div>
        ))}
      </main>
    </HydrateClient>
  );
}
