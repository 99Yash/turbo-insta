import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { type Metadata } from "next";
import { Inter } from "next/font/google";
import TailwindIndicator from "~/components/tailwind-indicator";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "../lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Instagram",
  description: "A trpc app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
