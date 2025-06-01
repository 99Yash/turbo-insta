"use client";

import { CogIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Icons, NucleoIcons } from "~/components/icons";
import { NotificationsSidebar } from "~/components/notifications/notifications-sidebar";
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
import { useUser } from "~/contexts/user-context";
import { cn, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const [isNotificationsSidebarOpen, setIsNotificationsSidebarOpen] =
    React.useState(false);

  const { data: unreadCount } = api.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  const count = unreadCount ?? 0;

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

  if (!user) {
    return null;
  }

  return (
    <>
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
            <Icons.logo aria-hidden="true" />
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

                {/* Notifications */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsNotificationsSidebarOpen(true)}
                    tooltip="Notifications"
                    className="transition-all duration-200"
                    aria-expanded={isNotificationsSidebarOpen}
                    aria-controls="notifications-sidebar"
                    aria-haspopup="dialog"
                  >
                    <div className="relative">
                      <NucleoIcons.HeartFill className="size-5" />
                      {count > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">Notifications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                      href={`/${user.username}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="size-5 border border-border/30">
                        <AvatarImage
                          src={user.imageUrl ?? ""}
                          alt={user.name ?? ""}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name ?? "VH")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.username}</span>
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

      {/* Overlay Notifications Sidebar */}
      <NotificationsSidebar
        isOpen={isNotificationsSidebarOpen}
        onClose={() => setIsNotificationsSidebarOpen(false)}
        unreadCount={count}
      />
    </>
  );
}
