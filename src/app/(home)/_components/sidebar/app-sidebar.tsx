"use client";

import type * as Ably from "ably";
import { useAbly } from "ably/react";
import { CogIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Icons, NucleoIcons } from "~/components/icons";
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
import { UserCommandDialog } from "~/components/ui/user-command-dialog";
import { siteConfig } from "~/config/site";
import { useUser } from "~/contexts/user-context";
import { cn, getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";
import { NotificationsSidebar } from "../notifications/notifications-sidebar";

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const [isNotificationsSidebarOpen, setIsNotificationsSidebarOpen] =
    React.useState(false);
  const client = useAbly();

  // Local state for real-time unread count updates (start with 0)
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  // Get initial unread count once on mount
  const { refetch: fetchInitialCount } =
    api.notifications.getUnreadCount.useQuery(undefined, {
      refetchOnWindowFocus: false,
    });

  // Fetch initial count once when user is available
  React.useEffect(() => {
    if (user) {
      void fetchInitialCount().then((result) => {
        if (result.data !== undefined) {
          setUnreadCount(result.data);
          console.log("📊 Initial unread count:", result.data);
        }
      });
    }
  }, [user, fetchInitialCount]);

  // Subscribe to websocket notifications for real-time count updates
  React.useEffect(() => {
    if (!user || !client) {
      console.log("⏸️ Websocket subscription skipped:", {
        user: !!user,
        client: !!client,
      });
      return;
    }

    const channelName = `notifications:${user.id}`;
    const channel = client.channels.get(channelName);

    const handler = (message: Ably.Message) => {
      console.log("🔔 Received websocket notification:", message.data);

      // Update local unread count directly from websocket message
      const data = message.data as {
        unreadCount?: number;
        type?: string;
        timestamp?: string;
      };
      if (typeof data?.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
        console.log("📊 Updated unread count to:", data.unreadCount);
      }
    };

    console.log("🔗 Attempting to subscribe to channel:", channelName);

    void channel.subscribe("notification", handler);
    console.log(
      "✅ Successfully subscribed to notifications channel:",
      channelName,
    );

    return () => {
      console.log("🔇 Unsubscribing from notifications channel");
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      channel.unsubscribe("notification", handler);
    };
  }, [user, client]);

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
                      <NucleoIcons.Cards className="size-5" />
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
                          {getInitials(user.name)}
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
