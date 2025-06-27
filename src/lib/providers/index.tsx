import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import * as React from "react";
import { TailwindIndicator } from "~/components/tailwind-indicator";
import { getUserById } from "~/server/api/services/user.service";
import { ClientProviders } from "./client-providers";

interface ProvidersProps {
  readonly children: React.ReactNode;
}

/**
 * Unified provider that combines all application providers
 * This is an async server component that fetches user data and provides it to client providers
 */
export async function Providers({ children }: ProvidersProps) {
  const { userId } = await auth();

  if (!userId) {
    return <div className="h-full">{children}</div>;
  }

  const user = await getUserById(userId);

  return (
    <ClerkProvider>
      <ClientProviders initialUser={user}>
        <div className="h-full">{children}</div>
        <TailwindIndicator />
      </ClientProviders>
    </ClerkProvider>
  );
}
