import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function ConversationNotFound() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-semibold">Conversation not found</h1>
        <p className="mb-6 text-muted-foreground">
          The conversation you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access to it.
        </p>
        <Button asChild>
          <Link href="/messages">Back to Messages</Link>
        </Button>
      </div>
    </div>
  );
}
