import { type User } from "@clerk/nextjs/server";
import { Create } from "../forms/create";
import { AuthDropdown } from "./auth-dropdown";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <MainNav />
        <MobileNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user && <Create />}
            <AuthDropdown user={user} />
          </nav>
        </div>
      </div>
    </header>
  );
}
