import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { AblyProviderWrapper } from "~/components/ably-provider-wrapper";
import TailwindIndicator from "~/components/tailwind-indicator";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { siteConfig } from "~/config/site";
import { ThemeProvider } from "~/lib/providers/theme-provider";
import { UserProvider } from "~/lib/providers/user-provider";
import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "../lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    shortcut: "/images/logo.svg",
    apple: "/images/logo.svg",
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@YashGouravKar1",
    site: siteConfig.url,
    creatorId: "YashGouravKar1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn("h-full scroll-smooth antialiased", inter.variable)}
      >
        <head />
        <body className="h-full min-h-screen bg-background">
          <TRPCReactProvider>
            <AblyProviderWrapper>
              <TooltipProvider delayDuration={10}>
                <ThemeProvider
                  attribute="class"
                  defaultTheme={"dark"}
                  enableSystem={false}
                  disableTransitionOnChange={false}
                >
                  <UserProvider>
                    <div className="h-full">{children}</div>
                  </UserProvider>
                </ThemeProvider>
              </TooltipProvider>
              <Toaster />
              <Analytics />
              <TailwindIndicator />
            </AblyProviderWrapper>
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
