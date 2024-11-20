import Link from "next/link";
import { getCachedUser } from "~/lib/queries/user";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  void api.post.getLatest.prefetch();
  const user = await getCachedUser();

  return (
    <HydrateClient>
      <main className="flex flex-col items-center justify-center">
        <Link href={`/${user?.id}`}>Go</Link>
      </main>
    </HydrateClient>
  );
}
