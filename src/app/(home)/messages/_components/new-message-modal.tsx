"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useUser } from "~/contexts/user-context";
import { useDebounce } from "~/hooks/use-debounce";
import { cn, getInitials, showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";

interface UserSearchResult {
  readonly id: string;
  readonly name: string;
  readonly username: string;
  readonly imageUrl: string | null;
  readonly isVerified: boolean;
}

interface NewMessageModalProps {
  readonly showModal: boolean;
  readonly setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  readonly onUserSelect: (userId: string) => void;
}

export function NewMessageModal({
  showModal,
  setShowModal,
  onUserSelect,
}: NewMessageModalProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<string>();

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch users for suggestions
  const { data: usersData, isLoading } = api.user.getUsersByUsername.useQuery(
    {
      query: debouncedSearchQuery,
      limit: 20,
    },
    {
      enabled: !!user && showModal,
      refetchOnWindowFocus: false,
    },
  );

  // Create conversation mutation
  const createConversationMutation =
    api.messages.createOrGetConversation.useMutation({
      onSuccess: (conversation) => {
        onUserSelect(conversation.id);
        setShowModal(false);
        setSearchQuery("");
        setSelectedUser(undefined);
      },
    });

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleStartChat = async () => {
    if (!selectedUser || !user?.id) return;

    try {
      await createConversationMutation.mutateAsync({
        participant2Id: selectedUser,
      });
    } catch (error) {
      console.error("Failed to create conversation:", error);
      showErrorToast(error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSearchQuery("");
    setSelectedUser(undefined);
  };

  // Filter out current user from suggestions
  const suggestedUsers: UserSearchResult[] =
    usersData?.filter((u) => u.id !== user?.id) ?? [];

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      onClose={handleClose}
      className="mx-auto max-w-md"
    >
      <div className="w-full max-w-md rounded-lg bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <h2 className="text-lg font-semibold">New message</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="border-b border-border/40 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              To:
            </span>
            <div className="relative flex-1">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-96">
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Suggested
            </h3>
          </div>

          <ScrollArea className="max-h-80">
            {isLoading ? (
              <div className="px-4 pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : suggestedUsers.length === 0 ? (
              <div className="px-4 py-8 pb-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No users found" : "No suggestions available"}
                </p>
              </div>
            ) : (
              <div className="px-4 pb-4">
                {suggestedUsers.map((suggestedUser) => (
                  <button
                    key={suggestedUser.id}
                    onClick={() => handleUserSelect(suggestedUser.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={suggestedUser.imageUrl ?? ""}
                        alt={suggestedUser.name}
                      />
                      <AvatarFallback>
                        {getInitials(suggestedUser.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">
                        {suggestedUser.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{suggestedUser.username}
                      </p>
                    </div>

                    {/* Radio button */}
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 border-border",
                        selectedUser === suggestedUser.id && "border-primary",
                      )}
                    >
                      {selectedUser === suggestedUser.id && (
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Button */}
        <div className="border-t border-border/40 p-4">
          <Button
            onClick={handleStartChat}
            disabled={!selectedUser || createConversationMutation.isPending}
            className="w-full rounded-lg"
          >
            {createConversationMutation.isPending ? "Starting..." : "Chat"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
