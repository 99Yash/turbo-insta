import { HydrateClient } from "~/trpc/server";
import { MessagesPageClient } from "./_components/messages-page-client";

export default function MessagesPage() {
  return (
    <HydrateClient>
      <MessagesPageClient />
    </HydrateClient>
  );
}
