"use client";

import { useUser } from "@clerk/nextjs";
import { CogIcon, Heart, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { siteConfig } from "~/config/site";
import { cn, getInitials } from "~/lib/utils";

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  const navItems = [
    {
      icon: Icons.home,
      filledIcon: Icons.homeFilled,
      label: "Home",
      href: "/",
    },
    {
      icon: Icons.message,
      filledIcon: Icons.message,
      label: "Messages",
      href: "/messages",
    },
    {
      icon: Heart,
      filledIcon: Heart,
      label: "Notifications",
      href: "/notifications",
    },
  ];

  return (
    <aside className="fixed bottom-0 z-10 w-full border-t bg-background lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-t-0">
      <div className="flex h-16 items-center justify-center max-lg:hidden lg:h-20">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Icons.logo className="size-7" aria-hidden="true" />
          {siteConfig.name}
        </Link>
      </div>

      <nav className="flex justify-around lg:block lg:px-4 lg:py-8">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = isActive ? item.filledIcon : item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-md p-2 transition-colors duration-300 hover:bg-muted md:mb-2",
                isActive && "font-bold",
              )}
            >
              <Icon className={cn("size-6")} />
              <span className="hidden text-sm font-semibold lg:inline">
                {item.label}
              </span>
            </Link>
          );
        })}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-4 rounded-md p-2 hover:bg-muted md:mt-auto",
            pathname.startsWith("/profile") && "font-bold",
          )}
        >
          <Avatar className="size-7 rounded-full">
            <AvatarImage
              src={user?.imageUrl ?? ""}
              alt={user?.fullName ?? ""}
            />
            <AvatarFallback>
              {getInitials(user?.fullName ?? "VH")}
            </AvatarFallback>
          </Avatar>
          <span className="hidden lg:inline">Profile</span>
        </Link>
      </nav>

      <nav className="hidden lg:block lg:px-4 lg:py-8">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-4 rounded-md p-2 hover:bg-muted",
            pathname.startsWith("/settings") && "font-bold",
          )}
        >
          <CogIcon className="size-6" />
          <span className="hidden lg:inline">Settings</span>
        </Link>
        <Link
          href="/signout"
          className={cn(
            "flex items-center gap-4 rounded-md p-2 hover:bg-muted",
            pathname.startsWith("/signout") && "font-bold",
          )}
        >
          <LogOutIcon className="size-6" />
          <span className="hidden lg:inline">Logout</span>
        </Link>
      </nav>
    </aside>
  );
}
