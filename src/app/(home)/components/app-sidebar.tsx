import { type User } from "@clerk/nextjs/server";
import { Heart, Search } from "lucide-react";
import Link from "next/link";
import { Icons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { siteConfig } from "~/config/site";
import { cn, getInitials } from "~/lib/utils";

interface SidebarProps {
  user: User;
}

export function AppSidebar({ user }: SidebarProps) {
  const navItems = [
    {
      icon: Icons.home,
      filledIcon: Icons.homeFilled,
      label: "Home",
      href: "/",
    },
    { icon: Search, filledIcon: Search, label: "Search", href: "/search" },
    {
      icon: Icons.create,
      filledIcon: Icons.create,
      label: "Create",
      href: "/create",
    },
    {
      icon: Icons.reel,
      filledIcon: Icons.reel,
      label: "Reels",
      href: "/reels",
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
    <aside className="fixed bottom-0 z-10 w-full border-t md:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-t-0">
      <div className="flex h-16 items-center justify-center max-lg:hidden lg:h-20">
        <Link href="/" className="text-xl font-bold">
          {siteConfig.name}
        </Link>
      </div>
      <nav className="flex justify-around lg:block lg:px-4 lg:py-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 rounded-md p-2 transition-colors duration-300 hover:bg-muted md:mb-2"
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
          className="flex items-center gap-4 rounded-md p-2 hover:bg-muted md:mt-auto"
        >
          <Avatar className="size-6">
            <AvatarImage src={user.imageUrl} alt={user.fullName ?? "User"} />
            <AvatarFallback>
              {getInitials(user.fullName ?? "VH")}
            </AvatarFallback>
          </Avatar>
          <span className="hidden lg:inline">Profile</span>
        </Link>
      </nav>
    </aside>
  );
}
