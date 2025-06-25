"use client";

import type * as Ably from "ably";
import { Pen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { PresenceIndicator } from "~/components/ui/presence-indicator";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuthenticatedUser } from "~/contexts/user-context";
import { MAX_REALTIME_MESSAGES } from "~/hooks/use-chat-messages";
import { usePresence } from "~/hooks/use-presence";
import { useAblyContext } from "~/lib/providers/ably-provider";
import { cn, formatTimeToNow, getInitials } from "~/lib/utils";
import type { ConversationWithParticipants } from "~/server/api/services/messages.service";
import { api } from "~/trpc/react";
import { NewMessageModal } from "./new-message-modal";

interface ConversationsSidebarProps {
  readonly onConversationSelect: (
    conversation: ConversationWithParticipants,
  ) => void;
  readonly selectedConversationId?: string;
}

export function ConversationsSidebar({
  onConversationSelect,
  selectedConversationId,
}: ConversationsSidebarProps) {
  const user = useAuthenticatedUser();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const client = useAblyContext();
  const router = useRouter();
  const utils = api.useUtils();

  // Initialize presence tracking
  const { isUserOnline } = usePresence();

  // Real-time conversation updates state
  const [realtimeUpdates, setRealtimeUpdates] = useState<
    Map<string, ConversationWithParticipants>
  >(new Map());

  const { data: conversationsData, isLoading: isLoadingConversations } =
    api.messages.getConversations.useQuery(
      {
        limit: MAX_REALTIME_MESSAGES,
      },
      {
        enabled: !!user,
      },
    );

  // Derive final conversations list combining server data with real-time updates
  const conversations = useMemo(() => {
    if (!conversationsData?.length) return [];

    const conversationsMap = new Map(
      conversationsData.map((conv) => [conv.id, conv]),
    );

    // Apply real-time updates
    realtimeUpdates.forEach((update, id) => {
      conversationsMap.set(id, update);
    });

    const finalConversations = Array.from(conversationsMap.values()).sort(
      (a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.createdAt;
        const bTime = b.lastMessage?.createdAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      },
    );

    return finalConversations;
  }, [conversationsData, realtimeUpdates]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!user || !client || !conversationsData?.length) return;

    const messagesChannelName = `messages:${user.id}`;
    const channel = client.channels.get(messagesChannelName);

    const handler = (message: Ably.Message) => {
      const data = message.data as {
        type: string;
        conversation: ConversationWithParticipants;
        timestamp: string;
      };

      if (data.type === "conversation_updated" && data.conversation) {
        // Normalize the conversation to ensure dates are Date objects
        const normalizedConversation = {
          ...data.conversation,
          createdAt: new Date(data.conversation.createdAt),
          updatedAt: data.conversation.updatedAt
            ? new Date(data.conversation.updatedAt)
            : null,
          lastMessage: data.conversation.lastMessage
            ? {
                ...data.conversation.lastMessage,
                createdAt: new Date(data.conversation.lastMessage.createdAt),
                updatedAt: data.conversation.lastMessage.updatedAt
                  ? new Date(data.conversation.lastMessage.updatedAt)
                  : null,
              }
            : null,
        };

        setRealtimeUpdates((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.conversation.id, normalizedConversation);
          return newMap;
        });
      }
    };

    void channel.subscribe("conversation_update", handler);

    return () => {
      void channel.unsubscribe("conversation_update", handler);
    };
  }, [user, client, conversationsData?.length]);

  const createConversationMutation =
    api.messages.getOrCreateConversation.useMutation({
      onSuccess: (conversation) => {
        // Invalidate and refetch conversations to ensure the new conversation appears
        void utils.messages.getConversations.invalidate();

        router.push(`/messages/${conversation.id}`);
        setShowNewMessageModal(false);
      },
      onError: (error) => {
        console.error(
          "❌ [ConversationsSidebar] Failed to create conversation:",
          error,
        );
      },
    });

  const handleUserSelect = useCallback(
    (userId: string) => {
      createConversationMutation.mutate({
        otherUserId: userId,
      });
    },
    [createConversationMutation],
  );

  /**
   * Get the participant who is NOT the current user
   */
  const getOtherParticipant = useCallback(
    (conversation: ConversationWithParticipants) => {
      const otherParticipant =
        conversation.participant1.id === user?.id
          ? conversation.participant2
          : conversation.participant1;

      return otherParticipant;
    },
    [user?.id],
  );

  return (
    <div className="flex h-screen w-full flex-col border-r border-border/40 bg-background sm:w-80 lg:w-96">
      {/* Header - Enhanced styling */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* User avatar */}
          <Avatar className="h-10 w-10 border-2 border-background shadow-md">
            <AvatarImage src={user.imageUrl ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2">
            <h2 className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-xl font-semibold">
              {user.username}
            </h2>
          </div>
        </div>

        {/* New message button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNewMessageModal(true)}
          className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-lg active:scale-95"
        >
          <Pen className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Primary tab (Messages) */}
        <div className="shrink-0 border-b border-border/40 bg-muted/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Messages
          </h3>
        </div>

        {/* Conversations list */}
        <ScrollArea className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            // Loading state with skeleton items
            <div className="space-y-1 p-2 pb-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex w-full items-center gap-4 rounded-xl p-3"
                >
                  <div className="relative">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background">
                      <Skeleton className="h-full w-full rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full max-w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 p-6 shadow-inner">
                <Icons.message className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="mb-2 text-lg font-semibold">No messages yet</h4>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Start a conversation with someone to see your messages here
              </p>
              <Button
                size="sm"
                onClick={() => setShowNewMessageModal(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-lg active:scale-95"
              >
                Send message
              </Button>
            </div>
          ) : (
            // Conversations list
            <div className="space-y-1 p-2 pb-4">
              {conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const isSelected = selectedConversationId === conversation.id;
                const isOtherUserOnline = isUserOnline(otherParticipant.id);

                return (
                  <button
                    key={conversation.id}
                    onClick={() => onConversationSelect(conversation)}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.02] hover:bg-muted/50 hover:shadow-md active:scale-100",
                      isSelected &&
                        "border border-red-100 bg-gradient-to-r from-red-50 to-pink-50 shadow-sm dark:border-red-900 dark:from-red-950/50 dark:to-pink-950/50",
                    )}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative">
                      <Avatar
                        className={cn(
                          "h-14 w-14 border-2 shadow-md transition-all duration-200",
                          isSelected
                            ? "border-red-200 shadow-red-100 dark:border-red-800 dark:shadow-red-900/20"
                            : "border-border/30 group-hover:border-border/60",
                        )}
                      >
                        <AvatarImage
                          src={otherParticipant.imageUrl ?? undefined}
                          alt={otherParticipant.name}
                        />
                        <AvatarFallback>
                          {getInitials(otherParticipant.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Real presence indicator */}
                      <PresenceIndicator
                        isOnline={isOtherUserOnline}
                        size="md"
                      />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h4
                          className={cn(
                            "truncate font-semibold transition-colors",
                            isSelected
                              ? "text-red-700 dark:text-red-300"
                              : "text-foreground",
                          )}
                        >
                          {otherParticipant.username}
                        </h4>

                        {/* Timestamp with enhanced styling */}
                        {conversation.lastMessage && (
                          <span
                            className={cn(
                              "shrink-0 text-xs font-medium transition-colors",
                              isSelected
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            {formatTimeToNow(
                              new Date(conversation.lastMessage.createdAt),
                            )}
                          </span>
                        )}
                      </div>

                      {/* Last message with better styling */}
                      <div className="flex items-center justify-between gap-2">
                        {conversation.lastMessage ? (
                          <p
                            className={cn(
                              "line-clamp-1 flex-1 text-xs transition-colors",
                              isSelected
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                            title={conversation.lastMessage.text}
                          >
                            {conversation.lastMessage.text}
                          </p>
                        ) : (
                          <p className="flex-1 text-sm italic text-muted-foreground">
                            Start a conversation
                          </p>
                        )}

                        {/* Unread indicator */}
                        {conversation.unreadCount > 0 && !isSelected && (
                          <div className="shrink-0">
                            {conversation.unreadCount > 9 ? (
                              <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white shadow-sm">
                                9+
                              </div>
                            ) : conversation.unreadCount > 1 ? (
                              <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white shadow-sm">
                                {conversation.unreadCount}
                              </div>
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-red-500 shadow-sm"></div>
                            )}
                          </div>
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
      {showNewMessageModal && (
        <NewMessageModal
          open={showNewMessageModal}
          onOpenChange={setShowNewMessageModal}
          onUserSelect={handleUserSelect}
        />
      )}
    </div>
  );
}
