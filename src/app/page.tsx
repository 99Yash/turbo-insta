import { api, HydrateClient } from "~/trpc/server";
import { LatestPost } from "./_components/post";

export default async function Home() {
  const hello = await api.post.hello({
    text: `from ${Math.random().toFixed(2)}`,
  });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="flex h-screen flex-col items-center justify-center">
        <p className="text-2xl font-medium">
          {hello ? hello.greeting : "Loading tRPC query..."}
        </p>

        <LatestPost />
        {/* <ModeToggle /> */}
      </main>
    </HydrateClient>
  );
}
