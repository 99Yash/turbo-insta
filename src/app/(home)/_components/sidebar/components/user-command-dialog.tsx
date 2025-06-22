"use client";

import { Search, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { useSidebar } from "~/components/ui/sidebar";
import { useDebounce } from "~/hooks/use-debounce";
import { api } from "~/trpc/react";

export interface UserOption {
  readonly id: string;
  readonly name: string | null;
  readonly username: string;
  readonly imageUrl: string | null;
  readonly isVerified: boolean;
}

export function UserCommandDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { state } = useSidebar();
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: users, isLoading } = api.user.searchUsers.useQuery(
    {
      query: debouncedSearch,
      offset: 0,
      size: 5,
    },
    {
      enabled: !!debouncedSearch,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  const handleUserSelect = (user: UserOption) => {
    router.push(`/${user.username}`);
    setOpen(false);
  };

  const renderUserItem = (user: UserOption) => (
    <CommandItem
      key={user.id}
      value={`${user.username} ${user.name ?? ""}`}
      onSelect={() => handleUserSelect(user)}
      className="flex items-center gap-2 px-4 py-3"
    >
      <User className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="font-medium">@{user.username}</span>
        {user.name && (
          <span className="text-sm text-muted-foreground">{user.name}</span>
        )}
      </div>
      {user.isVerified && <span className="ml-auto text-blue-500">✓</span>}
    </CommandItem>
  );

  const renderCommandDialog = () => (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a username to search users..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {!search.trim() ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="mb-4 h-8 w-8 text-muted-foreground" />
            <h3 className="mb-2 text-sm font-medium">Search for Users</h3>
            <p className="max-w-xs text-xs text-muted-foreground">
              Start typing a username or name to find users in your network.
            </p>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Search className="h-4 w-4 animate-pulse text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Searching users...
                </span>
              </div>
            ) : users && users.length > 0 ? (
              <CommandGroup heading="Users">
                {users.map(renderUserItem)}
              </CommandGroup>
            ) : (
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-6">
                  <Users className="mb-2 h-6 w-6 text-muted-foreground" />
                  <span className="text-sm">
                    No users found for &ldquo;{search}&rdquo;
                  </span>
                </div>
              </CommandEmpty>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );

  // Render icon-only trigger when sidebar is collapsed
  if (state === "collapsed") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="Search users (⌘K)"
        >
          <Search className="h-4 w-4" />
        </button>
        {renderCommandDialog()}
      </>
    );
  }

  // Render full input-styled trigger when sidebar is expanded
  return (
    <>
      {/* Input-styled trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>Search users...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      {renderCommandDialog()}
    </>
  );
}
