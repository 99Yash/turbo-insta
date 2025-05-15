"use client";

import { useUser } from "@clerk/nextjs";
import { CogIcon, Heart, LogOutIcon } from "lucide-react";
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
  SidebarProvider,
  SidebarSeparator,
} from "~/components/ui/sidebar";
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
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" className="border-r border-border/40">
        <SidebarHeader className="p-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 text-xl font-bold transition-colors hover:text-primary"
          >
            <Icons.logo className="size-7" aria-hidden="true" />
            <span className="transition-opacity duration-200">
              {siteConfig.name}
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
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
                      <Link href={item.href} passHref>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className="flex items-center gap-3 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={cn(
                                "size-5",
                                isActive && "text-primary",
                              )}
                            />
                            <span
                              className={cn(
                                "font-medium transition-all duration-200",
                                isActive && "text-primary",
                              )}
                            >
                              {item.label}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </Link>
                      {/* {item.badge && (
                        <SidebarMenuBadge
                          className={cn(
                            "bg-muted/80",
                            isActive && "bg-primary text-primary-foreground",
                          )}
                        >
                          {item.badge}
                        </SidebarMenuBadge>
                      )} */}
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
                  <Link href={`/${user?.username}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(`/${user?.username}`)}
                      tooltip="Profile"
                      className="transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-5 border border-border/30">
                          <AvatarImage
                            src={user?.imageUrl ?? ""}
                            alt={user?.fullName ?? ""}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(user?.fullName ?? "VH")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">Profile</span>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/40 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings" passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/settings")}
                  tooltip="Settings"
                  className="transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <CogIcon className="size-5" />
                    <span className="font-medium">Settings</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/signout" passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/signout")}
                  tooltip="Logout"
                  className="t ext-destructive/80 mt-2 transition-all duration-200 hover:text-destructive"
                >
                  <div className="flex items-center gap-3">
                    <LogOutIcon className="size-5" />
                    <span className="font-medium">Logout</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
