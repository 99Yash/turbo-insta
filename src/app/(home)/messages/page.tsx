import { HydrateClient } from "~/trpc/server";
import { MessagesContainer } from "../_components/messages/messages-container";

export default function MessagesPage() {
  return (
    <HydrateClient>
      <MessagesContainer />
    </HydrateClient>
  );
}
