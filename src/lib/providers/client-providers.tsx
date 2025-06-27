"use client";

import { Analytics } from "@vercel/analytics/react";
import * as React from "react";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { UserProvider } from "~/contexts/user-context";
import type { getCachedUser } from "~/lib/queries/user";
import { TRPCReactProvider } from "~/trpc/react";
import { AblyContextProvider } from "./ably-provider";
import { ThemeProvider } from "./theme-provider";

interface ClientProvidersProps {
  readonly children: React.ReactNode;
  readonly initialUser: Awaited<ReturnType<typeof getCachedUser>> | null;
}

/**
 * Client-side providers that need to be rendered on the client
 */
export function ClientProviders({
  children,
  initialUser,
}: ClientProvidersProps) {
  return (
    <TRPCReactProvider>
      <AblyContextProvider>
        <TooltipProvider delayDuration={10}>
          <ThemeProvider
            attribute="class"
            defaultTheme={"dark"}
            enableSystem={false}
            disableTransitionOnChange={false}
          >
            <UserProvider initialUser={initialUser}>{children}</UserProvider>
          </ThemeProvider>
        </TooltipProvider>
        <Toaster />
        <Analytics />
      </AblyContextProvider>
    </TRPCReactProvider>
  );
}
