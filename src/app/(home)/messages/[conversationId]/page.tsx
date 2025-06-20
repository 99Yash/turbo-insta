import { HydrateClient } from "~/trpc/server";
import { ConversationPageClient } from "./_components/conversation-page-client";

interface ConversationPageProps {
  readonly params: {
    readonly conversationId: string;
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  return (
    <HydrateClient>
      <ConversationPageClient conversationId={params.conversationId} />
    </HydrateClient>
  );
}
