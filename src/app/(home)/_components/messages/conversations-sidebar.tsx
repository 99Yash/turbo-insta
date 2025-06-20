"use client";

import { ChevronDown, Pen } from "lucide-react";
import { useState } from "react";
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
  readonly onConversationSelect?: (
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

  const { data: conversations, isLoading } =
    api.messages.getConversations.useQuery({
      limit: 20,
    });

  const getOtherParticipant = (conversation: ConversationWithParticipants) => {
    return conversation.participant1.id === user?.id
      ? conversation.participant2
      : conversation.participant1;
  };

  const formatLastMessage = (message: string) => {
    return message.length > 40 ? `${message.slice(0, 40)}...` : message;
  };

  const handleUserSelect = (userId: string) => {
    // TODO: Create conversation and select it
    console.log("Selected user:", userId);
    setShowNewMessageModal(false);
  };

  return (
    <>
      <div className="flex h-full w-80 flex-col border-r border-border/40 bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{user?.username}</h2>
            <ChevronDown className="h-4 w-4" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewMessageModal(true)}
            title="New message"
          >
            <Pen className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages and Requests tabs */}
        <div className="flex border-b border-border/40">
          <div className="flex-1 px-4 py-3 text-center">
            <button className="font-medium text-foreground">Messages</button>
          </div>
          <div className="flex-1 px-4 py-3 text-center">
            <button className="text-muted-foreground">Requests</button>
          </div>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Icons.spinner className="h-6 w-6" />
            </div>
          ) : conversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <Icons.message className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start a conversation with someone
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations?.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const isSelected = selectedConversationId === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => onConversationSelect?.(conversation)}
                    className={cn(
                      "flex w-full items-center gap-3 p-3 transition-colors hover:bg-muted/50",
                      isSelected && "bg-muted/50",
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
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium">
                          {otherParticipant.username}
                        </p>
                        {conversation.lastMessage && (
                          <time className="text-xs text-muted-foreground">
                            {formatTimeToNow(
                              conversation.lastMessage.createdAt,
                            )}
                          </time>
                        )}
                      </div>
                      {conversation.lastMessage ? (
                        <p className="truncate text-sm text-muted-foreground">
                          {formatLastMessage(conversation.lastMessage.text)}
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
      <NewMessageModal
        open={showNewMessageModal}
        onOpenChange={setShowNewMessageModal}
        onUserSelect={handleUserSelect}
      />
    </>
  );
}
