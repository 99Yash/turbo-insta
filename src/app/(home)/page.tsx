import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="flex flex-col items-center justify-center"></main>
    </HydrateClient>
  );
}
