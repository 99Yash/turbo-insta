import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "~/config/site";
import { Providers } from "~/lib/providers";
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
    <html
      lang="en"
      className={cn("h-full scroll-smooth antialiased", inter.variable)}
    >
      <head />
      <body className="h-full min-h-screen bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
