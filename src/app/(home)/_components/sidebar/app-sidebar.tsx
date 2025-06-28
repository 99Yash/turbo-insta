"use client";

import { SignOutButton, useAuth } from "@clerk/nextjs";
import type * as Ably from "ably";
import { CogIcon, Heart, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
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
import { useUser } from "~/contexts/user-context";
import { useAblyContext } from "~/lib/providers/ably-provider";
import { cn, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";
import { NotificationsSidebar } from "../notifications/notifications-sidebar";
import { UserCommandDialog } from "./components/user-command-dialog";

export function AppSidebar() {
  const { isLoaded } = useAuth();
  const { user, isLoading: isUserLoading } = useUser();
  const pathname = usePathname();
  const [isNotificationsSidebarOpen, setIsNotificationsSidebarOpen] =
    React.useState(false);
  const client = useAblyContext();

  // Local state for real-time unread count updates (start with 0)
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  // Get initial unread count once on mount
  const { refetch: fetchInitialCount } =
    api.notifications.getUnreadCount.useQuery(undefined, {
      enabled: !!user, // Only fetch when user exists
      refetchOnWindowFocus: false,
    });

  // Fetch initial count once when user is available
  React.useEffect(() => {
    if (isLoaded && user && !isUserLoading) {
      void fetchInitialCount().then((result) => {
        if (result.data !== undefined) {
          setUnreadCount(result.data);
        }
      });
    }
  }, [isLoaded, user, isUserLoading, fetchInitialCount]);

  // Subscribe to websocket notifications for real-time count updates
  React.useEffect(() => {
    if (!isLoaded || !user || !client || isUserLoading) return;

    const channelName = `notifications:${user.id}`;
    const channel = client.channels.get(channelName);

    const handler = (message: Ably.Message) => {
      // Update local unread count directly from websocket message
      const data = message.data as {
        unreadCount?: number;
        type?: string;
        timestamp?: string;
      };
      if (data?.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    };

    void channel.subscribe("notification", handler);

    return () => {
      void channel.unsubscribe("notification", handler);
    };
  }, [isLoaded, user, client, isUserLoading]);

  // Handle when notifications are marked as read
  const handleUnreadCountChange = React.useCallback((newCount: number) => {
    setUnreadCount(newCount);
  }, []);

  // Show loading skeleton if user is still loading
  if (isUserLoading || !user) {
    return (
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Use the real-time unread count
  const count = unreadCount;

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
    <>
      <Sidebar
        variant="floating"
        collapsible="icon"
        className="border-r border-border/40"
      >
        <SidebarHeader className="p-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 text-xl font-bold transition-colors hover:text-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
          >
            <Icons.logo
              aria-hidden="true"
              className="size-6 group-data-[collapsible=icon]:size-5"
            />
            <span className="transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
              {siteConfig.name}
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <div className="p-4 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
            <UserCommandDialog />
          </div>
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
                      <Heart
                        className={cn(
                          "size-[18px]",
                          count > 0 && "text-rose-500",
                        )}
                      />
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
              {user && (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/${user.username}`}
                      tooltip="Profile"
                      className="mr-2 flex items-center gap-3 transition-all duration-200"
                    >
                      <Link
                        href={`/${user.username}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="size-5 border border-border/30">
                          <AvatarImage
                            src={user.imageUrl ?? undefined}
                            alt={user.name}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}
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
              <SignOutButton redirectUrl="/signin">
                <SidebarMenuButton tooltip="Logout" className="mt-2">
                  <LogOutIcon className="size-5" />
                  <span className="font-medium">Logout</span>
                </SidebarMenuButton>
              </SignOutButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Overlay Notifications Sidebar */}
      <NotificationsSidebar
        isOpen={isNotificationsSidebarOpen}
        onClose={() => setIsNotificationsSidebarOpen(false)}
        unreadCount={count}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
}
