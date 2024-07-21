import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import TailwindIndicator from "~/components/tailwind-indicator";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster as Sonner } from "~/components/ui/sonner";
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
    <html lang="en" className={cn("scroll-smooth antialiased", inter.variable)}>
      <head />
      <body className="min-h-screen">
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
          </ThemeProvider>
          <Sonner />
          <TailwindIndicator />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
