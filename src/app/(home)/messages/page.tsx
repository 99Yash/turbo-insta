import { HydrateClient } from "~/trpc/server";
import { MessagesContainer } from "./_components/messages-container";

export default function MessagesPage() {
  return (
    <HydrateClient>
      <MessagesContainer />
    </HydrateClient>
  );
}
