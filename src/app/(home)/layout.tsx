"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { SidebarLayout } from "./_components/sidebar/sidebar-layout";

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

  // Profile pages and their subroutes should be centered with wider width
  // Matches: /username, /username/tagged, /username/saved
  const isProfileRoute = /^\/[^\/]+\/?(?:tagged|saved)?$/.exec(pathname);

  if (isProfileRoute) {
    return (
      <SidebarLayout variant="centered" width="w-[800px]">
        {children}
      </SidebarLayout>
    );
  }

  // Default to centered layout for feed pages with smaller width
  return (
    <SidebarLayout variant="centered" width="w-[470px]">
      {children}
    </SidebarLayout>
  );
}
