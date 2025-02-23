import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { ImageResponse } from "next/og";
import TailwindIndicator from "~/components/tailwind-indicator";
import { ThemeProvider } from "~/components/theme-provider";
import { NucleoPhoto } from "~/components/ui/icons/nucleo";
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
    icon: [
      { url: "/icon", type: "image/png" },
      {
        url: "/icon-dark",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    title: "Repligram",
    description: "A social media platform for sharing your thoughts and ideas.",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Sign in page with dramatic side lighting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repligram",
    description: "A social media platform for sharing your thoughts and ideas.",
    images: [siteConfig.ogImage],
    creator: "@YashGouravKar1",
    site: siteConfig.links.web,
  },
};

export const contentType = "image/png";

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
            <TooltipProvider delayDuration={10}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange={false}
              >
                <div className="h-full">{children}</div>
              </ThemeProvider>
            </TooltipProvider>
            <Toaster />
            <Analytics />
            <TailwindIndicator />
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

export function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000",
          background: "transparent",
        }}
      >
        <NucleoPhoto style={{ width: "100%", height: "100%" }} />
      </div>
    ),
    {
      width: 32,
      height: 32,
    },
  );
}
