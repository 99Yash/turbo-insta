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

  // Always wrap with ClerkProvider, even when user is not signed in
  if (!userId) {
    return (
      <ClerkProvider>
        <ClientProviders initialUser={null}>
          <div className="h-full">{children}</div>
          <TailwindIndicator />
        </ClientProviders>
      </ClerkProvider>
    );
  }

  console.log(`[Providers] Attempting to fetch user for userId: ${userId}`);

  let user = null;
  try {
    user = await getUserById(userId);
    console.log(`[Providers] Successfully fetched user: ${user.username}`);
  } catch (error) {
    console.log(`[Providers] Failed to fetch user from database:`, error);
    // User might not exist in database yet (webhook hasn't processed)
    // Continue with null user to prevent SSR error
  }

  return (
    <ClerkProvider>
      <ClientProviders initialUser={user}>
        <div className="h-full">{children}</div>
        <TailwindIndicator />
      </ClientProviders>
    </ClerkProvider>
  );
}
