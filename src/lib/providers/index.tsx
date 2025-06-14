import { ClerkProvider } from "@clerk/nextjs";
import * as React from "react";
import TailwindIndicator from "~/components/tailwind-indicator";
import { getCachedUser } from "~/lib/queries/user";
import { ClientProviders } from "./client-providers";

interface ProvidersProps {
  readonly children: React.ReactNode;
}

/**
 * Unified provider that combines all application providers
 * This is an async server component that fetches user data and provides it to client providers
 */
export async function Providers({ children }: ProvidersProps) {
  const user = await getCachedUser();

  return (
    <ClerkProvider>
      <ClientProviders initialUser={user}>
        <div className="h-full">{children}</div>
        <TailwindIndicator />
      </ClientProviders>
    </ClerkProvider>
  );
}
