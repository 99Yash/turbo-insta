"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { useUser } from "~/contexts/user-context";
import { useDebounce } from "~/hooks/use-debounce";
import { getInitials } from "~/lib/utils";
import { api } from "~/trpc/react";

interface NewMessageModalProps {
  readonly open: boolean;
  readonly onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  readonly onUserSelect?: (userId: string) => void;
}

export function NewMessageModal({
  open,
  onOpenChange,
  onUserSelect,
}: NewMessageModalProps) {
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [open]);

  // Search users based on debounced query
  const { data: searchResults } = api.user.searchUsers.useQuery(
    {
      query: debouncedSearchQuery,
      offset: 0,
      size: 10,
    },
    {
      enabled: debouncedSearchQuery.trim().length > 0,
    },
  );

  const handleUserSelect = (userId: string) => {
    onUserSelect?.(userId);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Modal
      showModal={open}
      setShowModal={onOpenChange}
      className="mx-4 w-full max-w-md"
    >
      <div className="overflow-hidden rounded-lg bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <h2 className="text-lg font-semibold">New message</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search input */}
        <div className="border-b border-border/40">
          <div className="flex items-center gap-2 p-4">
            <span className="text-sm font-medium">To:</span>
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/40 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* User list */}
        <div className="max-h-96 overflow-y-auto">
          <div className="p-4">
            {debouncedSearchQuery.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Search for users to start a conversation
              </p>
            ) : (
              <>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Search results
                </h3>

                {searchResults?.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No users found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {searchResults?.map((user) => {
                      if (user.id === currentUser?.id) return null;

                      return (
                        <button
                          type="button"
                          key={user.id}
                          onClick={() => handleUserSelect(user.id)}
                          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
                        >
                          <Avatar className="h-10 w-10 border border-border/30">
                            <AvatarImage
                              src={user.imageUrl ?? undefined}
                              alt={user.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
