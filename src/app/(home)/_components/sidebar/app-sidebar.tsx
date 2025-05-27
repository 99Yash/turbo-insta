"use client";

import { CogIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";
import { siteConfig } from "~/config/site";
import { cn, getInitials } from "~/lib/utils";
import { type User } from "~/server/db/schema";

export function AppSidebar({ user }: { user: User }) {
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
      filledIcon: Icons.messageFilled,
      label: "Messages",
      href: "/messages",
    },
  ];

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="border-r border-border/40"
    >
      <SidebarHeader className="p-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 text-xl font-bold transition-colors hover:text-primary"
        >
          <Icons.logo
            aria-hidden="true"
            className="group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
          />
          <span className="transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
            {siteConfig.name}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = isActive ? item.filledIcon : item.icon;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="transition-all duration-200"
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                      >
                        <Icon
                          className={cn("size-5", isActive && "text-primary")}
                        />
                        <span
                          className={cn(
                            "font-medium transition-all duration-200",
                            isActive && "text-primary",
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-3" />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(`/${user?.username}`)}
                  tooltip="Profile"
                  className="mr-2 flex items-center gap-3 transition-all duration-200"
                >
                  <Link
                    href={`/${user?.username}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="size-5 border border-border/30">
                      <AvatarImage
                        src={user?.imageUrl ?? ""}
                        alt={user?.name ?? ""}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(user?.name ?? "VH")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
              className="transition-all duration-200"
            >
              <Link href="/settings" className="flex items-center gap-3">
                <CogIcon className="size-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/signout")}
              tooltip="Logout"
              className="mt-2"
            >
              <Link href="/signout" className="flex items-center gap-3">
                <LogOutIcon className="size-5" />
                <span className="font-medium">Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
