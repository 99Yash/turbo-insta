"use client";

import type * as Ably from "ably";
import { useAbly } from "ably/react";
import { ChevronDown, Pen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icons } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useUser } from "~/contexts/user-context";
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
  const { user } = useUser();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const client = useAbly();
  const router = useRouter();

  // Local state to manage conversations for real-time updates
  const [localConversations, setLocalConversations] = useState<
    ConversationWithParticipants[]
  >([]);

  const { data: conversationsData } = api.messages.getConversations.useQuery(
    { limit: 20 },
    {
      enabled: !!user,
    },
  );

  // Initialize local conversations when data is fetched
  useEffect(() => {
    if (conversationsData) {
      setLocalConversations(conversationsData);
    }
  }, [conversationsData]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!user || !client) return;

    const messagesChannelName = `messages:${user.id}`;
    const channel = client.channels.get(messagesChannelName);

    const handler = (message: Ably.Message) => {
      const data = message.data as {
        type?: string;
        conversation?: ConversationWithParticipants;
        timestamp?: string;
      };

      if (data?.type === "conversation_updated" && data.conversation) {
        console.log(
          "🔔 [ConversationsSidebar] Conversation updated:",
          data.conversation,
        );

        // Update the conversation in local state
        setLocalConversations((prevConversations) => {
          const existingIndex = prevConversations.findIndex(
            (conv) => conv.id === data.conversation!.id,
          );

          // Normalize the conversation to ensure dates are Date objects
          const normalizedConversation = {
            ...data.conversation!,
            createdAt: new Date(data.conversation!.createdAt),
            updatedAt: data.conversation!.updatedAt
              ? new Date(data.conversation!.updatedAt)
              : null,
            lastMessage: data.conversation!.lastMessage
              ? {
                  ...data.conversation!.lastMessage,
                  createdAt: new Date(data.conversation!.lastMessage.createdAt),
                  updatedAt: data.conversation!.lastMessage.updatedAt
                    ? new Date(data.conversation!.lastMessage.updatedAt)
                    : null,
                }
              : null,
          };

          if (existingIndex !== -1) {
            // Update existing conversation and move it to the top
            const updatedConversations = [...prevConversations];
            updatedConversations[existingIndex] = normalizedConversation;

            // Move the updated conversation to the top
            const [updatedConv] = updatedConversations.splice(existingIndex, 1);
            return [updatedConv!, ...updatedConversations];
          } else {
            // Add new conversation at the top
            return [normalizedConversation, ...prevConversations];
          }
        });
      }
    };

    void channel.subscribe("conversation_update", handler);
    console.log(
      "✅ [ConversationsSidebar] Subscribed to messages channel:",
      messagesChannelName,
    );

    return () => {
      console.log(
        "🔇 [ConversationsSidebar] Unsubscribing from messages channel",
      );
      void channel.unsubscribe("conversation_update", handler);
    };
  }, [user, client]);

  const createConversationMutation =
    api.messages.getOrCreateConversation.useMutation({
      onSuccess: (conversation) => {
        router.push(`/messages/${conversation.id}`);
        setShowNewMessageModal(false);
      },
    });

  const handleUserSelect = (userId: string) => {
    createConversationMutation.mutate({
      otherUserId: userId,
    });
  };

  /**
   * Get the participant who is NOT the current user
   */
  const getOtherParticipant = (conversation: ConversationWithParticipants) => {
    return conversation.participant1.id === user?.id
      ? conversation.participant2
      : conversation.participant1;
  };

  return (
    <div className="flex h-full w-80 flex-col border-r border-border/40 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{user?.username}</h2>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNewMessageModal(true)}
          className="h-8 w-8"
        >
          <Pen className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Primary tab (Messages) */}
        <div className="border-b border-border/40 p-4">
          <h3 className="text-sm font-medium">Messages</h3>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1">
          {localConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <Icons.message className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="mb-2 text-sm font-medium">No messages yet</h4>
              <p className="mb-4 text-xs text-muted-foreground">
                Start a conversation with someone
              </p>
              <Button
                size="sm"
                onClick={() => setShowNewMessageModal(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Send message
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {localConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const isSelected = selectedConversationId === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => onConversationSelect(conversation)}
                    className={cn(
                      "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                      isSelected && "bg-muted/80",
                    )}
                  >
                    <Avatar className="h-12 w-12 border border-border/30">
                      <AvatarImage
                        src={otherParticipant.imageUrl ?? ""}
                        alt={otherParticipant.name}
                      />
                      <AvatarFallback>
                        {getInitials(otherParticipant.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h4 className="truncate font-medium">
                          {otherParticipant.username}
                        </h4>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatTimeToNow(
                              new Date(conversation.lastMessage.createdAt),
                            )}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage ? (
                        <p className="truncate text-sm text-muted-foreground">
                          {conversation.lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Start a conversation
                        </p>
                      )}
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
