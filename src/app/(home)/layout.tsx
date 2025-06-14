"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { SidebarLayout } from "./_components/sidebar/components";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  if (!user || !isLoaded || !isSignedIn) {
    return null;
  }

  // Don't add sidebar for messages route since it has its own layout
  if (pathname.startsWith("/messages")) {
    return <>{children}</>;
  }

  // Profile pages and their subroutes should be full-width
  // Matches: /username, /username/tagged, /username/saved
  const isProfileRoute = /^\/[^\/]+\/?(?:tagged|saved)?$/.exec(pathname);

  // Use single SidebarLayout that stays mounted to avoid animation issues
  return (
    <SidebarLayout
      layout={isProfileRoute ? "full-width" : "centered"}
      contentWidth={isProfileRoute ? "max-w-[800px]" : "max-w-[470px]"}
      sidebarVariant="default"
    >
      {children}
    </SidebarLayout>
  );
}
