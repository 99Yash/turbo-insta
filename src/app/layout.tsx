import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import TailwindIndicator from "~/components/tailwind-indicator";
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
      <body>
        <TRPCReactProvider>
          {children}
          <TailwindIndicator />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
