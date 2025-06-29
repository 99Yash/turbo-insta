import { HydrateClient } from "~/trpc/server";
import { HomePageClient } from "./_components/home-page-client";

export default async function HomePage() {
  return (
    <HydrateClient>
      <HomePageClient />
    </HydrateClient>
  );
}
