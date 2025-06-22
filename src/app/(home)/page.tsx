import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { HomePageClient } from "./_components/home-page-client";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/signin");
  }

  return (
    <HydrateClient>
      <HomePageClient />
    </HydrateClient>
  );
}
