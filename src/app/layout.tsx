import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { type Metadata } from "next";
import { Inter } from "next/font/google";
import TailwindIndicator from "~/components/tailwind-indicator";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { siteConfig } from "~/config/site";
import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "../lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Repligram",
  description: "A social media platform for sharing your thoughts and ideas.",
  icons: {
    shortcut: "/images/repligram.webp",
    apple: "/images/repligram.webp",
  },
  openGraph: {
    title: "Repligram",
    description: "A social media platform for sharing your thoughts and ideas.",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Repligram",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repligram",
    description: "A social media platform for sharing your thoughts and ideas.",
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
      <html lang="en" className={cn("dark", inter.variable)}>
        <head />
        <body className="min-h-full bg-background">
          <TRPCReactProvider>
            <TooltipProvider delayDuration={10}>{children}</TooltipProvider>
            <Toaster />
            <Analytics />
            <TailwindIndicator />
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
