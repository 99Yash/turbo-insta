"use client";

import { Search, User, Users } from "lucide-react";
import * as React from "react";
import { useDebounce } from "~/hooks/use-debounce";
import { api } from "~/trpc/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { useSidebar } from "./sidebar";

export interface UserOption {
  readonly id: string;
  readonly name: string | null;
  readonly username: string;
  readonly imageUrl: string | null;
  readonly isVerified: boolean;
}

interface UserCommandDialogProps {
  onUserSelect?: (user: UserOption) => void;
}

export function UserCommandDialog({ onUserSelect }: UserCommandDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const { state } = useSidebar();
  const debouncedSearch = useDebounce(search, 300);
  const utils = api.useUtils();

  // Keyboard shortcut to open dialog
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

  // Search users when debounced search changes
  React.useEffect(() => {
    if (!debouncedSearch.trim()) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      try {
        const result = await utils.user.searchUsers.fetch({
          query: debouncedSearch,
          offset: 0,
          size: 10, // Limit results for command palette
        });
        setUsers(result);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    void searchUsers();
  }, [debouncedSearch, utils]);

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setUsers([]);
    }
  }, [open]);

  const handleUserSelect = (user: UserOption) => {
    onUserSelect?.(user);
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

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput
            placeholder="Type a username to search users..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!search.trim() ? (
              // Show helper content when not searching
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
                ) : users.length > 0 ? (
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a username to search users..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {!search.trim() ? (
            // Show helper content when not searching
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
              ) : users.length > 0 ? (
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
    </>
  );
}
