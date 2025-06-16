"use client";

import type * as Ably from "ably";
import { useAbly } from "ably/react";
import { Edit, Search } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useUser } from "~/contexts/user-context";
import { cn, formatTimeToNow, getInitials, truncate } from "~/lib/utils";
import type { ConversationWithDetails } from "~/server/api/services/messages.service";
import { api } from "~/trpc/react";
import { NewMessageModal } from "./new-message-modal";

interface ConversationsListProps {
  readonly selectedConversationId?: string;
  readonly onConversationSelect: (conversationId: string) => void;
}

export function ConversationsList({
  selectedConversationId,
  onConversationSelect,
}: ConversationsListProps) {
  const { user } = useUser();
  const client = useAbly();
  const [conversations, setConversations] = React.useState<
    ConversationWithDetails[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showNewMessageModal, setShowNewMessageModal] = React.useState(false);

  // Fetch conversations
  const { data: conversationsData, refetch } =
    api.messages.getConversations.useQuery(
      { limit: 50 },
      {
        enabled: !!user,
        refetchOnWindowFocus: false,
      },
    );

  // Update local state when data changes
  React.useEffect(() => {
    if (conversationsData) {
      setConversations(conversationsData.conversations);
      setIsLoading(false);
    }
  }, [conversationsData]);

  // Subscribe to real-time message updates for conversation list
  React.useEffect(() => {
    if (!user || !client) return;

    const channelName = `messages:${user.id}`;
    const channel = client.channels.get(channelName);

    const handler = (message: Ably.Message) => {
      const data = message.data as {
        type: string;
        conversationId: string;
        lastMessage?: {
          id: string;
          content: string | null;
          type: string;
          createdAt: Date;
        };
        sender?: {
          id: string;
          name: string;
          username: string;
          imageUrl: string | null;
        };
        unreadCount?: number;
        timestamp: string;
      };

      if (data.type === "new_message") {
        setConversations((prev) => {
          const existingIndex = prev.findIndex(
            (conv) => conv.id === data.conversationId,
          );

          if (existingIndex >= 0) {
            // Update existing conversation
            const updated = [...prev];
            const conversation = updated[existingIndex]!;
            updated[existingIndex] = {
              ...conversation,
              lastMessage: data.lastMessage ?? null,
              unreadCount: data.unreadCount ?? conversation.unreadCount,
            };

            // Move to top if it's not the selected conversation
            if (conversation.id !== selectedConversationId) {
              const [updatedConv] = updated.splice(existingIndex, 1);
              updated.unshift(updatedConv!);
            }

            return updated;
          } else {
            // New conversation, refetch to get full details
            void refetch();
            return prev;
          }
        });
      }
    };

    void channel.subscribe("message", handler);

    return () => {
      void channel.unsubscribe("message", handler);
    };
  }, [user, client, selectedConversationId, refetch]);

  // Mark messages as read when conversation is selected
  const markAsReadMutation = api.messages.markAsRead.useMutation();

  const handleConversationClick = React.useCallback(
    (conversationId: string) => {
      onConversationSelect(conversationId);

      // Store the original unread count for rollback
      const originalConversation = conversations.find(
        (conv) => conv.id === conversationId,
      );
      const originalUnreadCount = originalConversation?.unreadCount ?? 0;

      // Optimistic update - mark as read immediately
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
        ),
      );

      // Mark as read on server
      markAsReadMutation.mutateAsync({ conversationId }).catch((error) => {
        // Rollback optimistic update on failure
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, unreadCount: originalUnreadCount }
              : conv,
          ),
        );

        // Log error for debugging
        console.error("Failed to mark conversation as read:", error);

        // You could also show a toast notification here if you have a notification system
        // toast.error("Failed to mark messages as read");
      });
    },
    [onConversationSelect, markAsReadMutation, conversations],
  );

  // Filter conversations based on search
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter((conversation) => {
      const otherParticipant =
        conversation.participant1.id === user?.id
          ? conversation.participant2
          : conversation.participant1;

      return (
        otherParticipant.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        otherParticipant.username
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    });
  }, [conversations, searchQuery, user?.id]);

  const handleNewMessageClick = () => {
    setShowNewMessageModal(true);
  };

  const handleUserSelect = (conversationId: string) => {
    onConversationSelect(conversationId);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="flex h-full w-full max-w-sm flex-col border-r border-border/40 bg-background">
        {/* Header */}
        <div className="border-b border-border/40 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{user.username}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNewMessageClick}
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button variant="ghost" size="sm" className="text-sm text-primary">
            Requests
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border-0 bg-muted/50 pl-10 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="px-6">
              {/* Loading skeleton */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-4">
                  <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
                <Edit className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Your messages</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Send a message to start a chat.
              </p>
              <Button onClick={handleNewMessageClick} className="rounded-lg">
                Send message
              </Button>
            </div>
          ) : (
            <div className="px-2">
              {filteredConversations.map((conversation) => {
                const otherParticipant =
                  conversation.participant1.id === user.id
                    ? conversation.participant2
                    : conversation.participant1;

                const isSelected = conversation.id === selectedConversationId;
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className={cn(
                      "w-full rounded-lg p-4 text-left transition-colors",
                      isSelected ? "bg-muted/50" : "hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-14 w-14">
                          <AvatarImage
                            src={otherParticipant.imageUrl ?? ""}
                            alt={otherParticipant.name}
                          />
                          <AvatarFallback>
                            {getInitials(otherParticipant.name)}
                          </AvatarFallback>
                        </Avatar>
                        {hasUnread && (
                          <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm",
                              hasUnread ? "font-semibold" : "font-medium",
                            )}
                          >
                            {otherParticipant.name}
                          </p>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatTimeToNow(
                                conversation.lastMessage.createdAt,
                              )}
                            </span>
                          )}
                        </div>

                        {conversation.lastMessage ? (
                          <p
                            className={cn(
                              "truncate text-sm text-muted-foreground",
                              hasUnread && "font-medium text-foreground",
                            )}
                          >
                            {conversation.lastMessage.type === "image"
                              ? "📷 Photo"
                              : truncate(
                                  conversation.lastMessage.content ?? "",
                                  40,
                                )}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Start a conversation
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        showModal={showNewMessageModal}
        setShowModal={setShowNewMessageModal}
        onUserSelect={handleUserSelect}
      />
    </>
  );
}
