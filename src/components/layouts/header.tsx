import { User } from "@clerk/nextjs/server";
import { siteConfig } from "~/config/site";
import { MainNav } from "./main-nav";

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <MainNav items={siteConfig.mainNav} />
        {/* <MobileNav items={siteConfig.mainNav} /> */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {/* <ProductsCombobox />
            <CartSheet />
            <AuthDropdown user={user} /> */}
          </nav>
        </div>
      </div>
    </header>
  );
}
