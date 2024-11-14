import { SQL } from "drizzle-orm";
import { Icons } from "~/components/icons";

export interface NavItem {
  title: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
}

export interface NavItemWithChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithChildren;

export type SidebarNavItem = NavItemWithChildren;

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export interface StoredFile {
  id: string;
  name: string;
  url: string;
}

export type DrizzleWhere<T> =
  | SQL<unknown>
  | ((aliases: T) => SQL<T> | undefined)
  | undefined;
