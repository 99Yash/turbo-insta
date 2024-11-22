import { type User } from "@clerk/nextjs/server";
import { AuthDropdown } from "./auth-dropdown";
import { Create } from "./create";
import { MainNav } from "./main-nav";

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Create />
            <AuthDropdown user={user} />
          </nav>
        </div>
      </div>
    </header>
  );
}
