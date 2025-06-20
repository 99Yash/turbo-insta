"use client";

import { ArrowLeft, Plus, Send } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useUser } from "~/contexts/user-context";
import { cn, formatTimeToNow, getInitials } from "~/lib/utils";
import type { ConversationWithParticipants } from "~/server/api/services/messages.service";
import { api } from "~/trpc/react";
import { NewMessageModal } from "./new-message-modal";

interface ChatAreaProps {
  readonly conversation?: ConversationWithParticipants;
  readonly onUserSelect?: (userId: string) => void;
  readonly onBack?: () => void;
}

export function ChatArea({
  conversation,
  onUserSelect,
  onBack,
}: ChatAreaProps) {
  const { user } = useUser();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");

  const { data: messagesData } = api.messages.getConversationMessages.useQuery(
    {
      conversationId: conversation?.id ?? "",
      limit: 50,
    },
    {
      enabled: !!conversation?.id,
      refetchInterval: 3000, // Poll for new messages every 3 seconds
    },
  );

  const sendMessageMutation = api.messages.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      // Trigger refetch of messages
    },
  });

  const handleUserSelect = (userId: string) => {
    onUserSelect?.(userId);
  };

  /**
   * Get the participant who is NOT the current user
   */
  const getOtherParticipant = (conversation: ConversationWithParticipants) => {
    return conversation.participant1.id === user?.id
      ? conversation.participant2
      : conversation.participant1;
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !conversation) return;

    const otherParticipant = getOtherParticipant(conversation);
    sendMessageMutation.mutate({
      receiverId: otherParticipant.id,
      text: messageText.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Empty state when no conversation is selected
  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-foreground">
            <Send className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-light">Your messages</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Send a message to start a chat.
          </p>
          <Button
            onClick={() => setShowNewMessageModal(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Send message
          </Button>

          {showNewMessageModal && (
            <NewMessageModal
              open={showNewMessageModal}
              onOpenChange={setShowNewMessageModal}
              onUserSelect={handleUserSelect}
            />
          )}
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant(conversation);
  const messages = messagesData?.messages ?? [];

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Chat header */}
      <div className="flex items-center border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Avatar className="h-10 w-10 border border-border/30">
            <AvatarImage
              src={otherParticipant.imageUrl ?? ""}
              alt={otherParticipant.name}
            />
            <AvatarFallback>
              {getInitials(otherParticipant.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-semibold">{otherParticipant.username}</h3>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Avatar className="mb-4 h-16 w-16">
                <AvatarImage
                  src={otherParticipant.imageUrl ?? ""}
                  alt={otherParticipant.name}
                />
                <AvatarFallback className="text-lg">
                  {getInitials(otherParticipant.name)}
                </AvatarFallback>
              </Avatar>
              <h4 className="mb-2 font-semibold">
                {otherParticipant.username}
              </h4>
              <p className="text-sm text-muted-foreground">
                Start a conversation with {otherParticipant.username}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const showAvatar =
                index === 0 ||
                messages[index - 1]?.senderId !== message.senderId;
              const showSenderName = showAvatar && !isOwnMessage;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    isOwnMessage ? "justify-end" : "justify-start",
                    showAvatar ? "mt-4" : "mt-1",
                  )}
                >
                  {/* Avatar for incoming messages */}
                  {!isOwnMessage && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={message.sender.imageUrl ?? ""}
                            alt={message.sender.name}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex max-w-[80%] flex-col",
                      isOwnMessage ? "items-end" : "items-start",
                    )}
                  >
                    {/* Sender name for incoming messages */}
                    {showSenderName && (
                      <span className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {message.sender.username}
                      </span>
                    )}

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "break-words rounded-2xl px-4 py-2 text-sm",
                        isOwnMessage
                          ? "rounded-br-md bg-red-500 text-white"
                          : "rounded-bl-md bg-muted text-foreground",
                      )}
                    >
                      {message.text}
                    </div>

                    {/* Timestamp */}
                    <span className="mt-1 text-xs text-muted-foreground">
                      {formatTimeToNow(message.createdAt)}
                    </span>
                  </div>

                  {/* Spacer for outgoing messages */}
                  {isOwnMessage && <div className="h-8 w-8 flex-shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="border-t border-border/40 p-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-full border border-border/40 bg-background">
            <input
              type="text"
              placeholder="Message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              className="flex-1 rounded-full bg-transparent px-4 py-2 text-sm focus:outline-none"
            />
            {messageText.trim() ? (
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                className="mr-1 h-8 w-8 rounded-full bg-blue-500 p-0 text-white hover:bg-blue-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="mr-1 h-8 w-8 rounded-full p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
