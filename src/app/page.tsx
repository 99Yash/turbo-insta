import { api, HydrateClient } from "~/trpc/server";
import { LatestPost } from "./_components/post";

export default async function Home() {
  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LatestPost />
      </main>
    </HydrateClient>
  );
}
