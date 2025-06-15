"use client";

import type * as Ably from "ably";
import { useAbly } from "ably/react";
import { Info, Phone, Video } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useUser } from "~/contexts/user-context";
import {
  cn,
  createPrivateChannelName,
  formatTimeToNow,
  getInitials,
  safeParseDate,
} from "~/lib/utils";
import type { MessageWithDetails } from "~/server/api/services/messages.service";
import { api } from "~/trpc/react";
import { MessageInput } from "./message-input";

interface MessagesViewProps {
  readonly conversationId: string;
}

export function MessagesView({ conversationId }: MessagesViewProps) {
  const { user } = useUser();
  const client = useAbly();
  const [messages, setMessages] = React.useState<MessageWithDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [otherParticipant, setOtherParticipant] = React.useState<{
    id: string;
    name: string;
    username: string;
    imageUrl: string | null;
  } | null>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messagesData } = api.messages.getMessages.useQuery(
    { conversationId, limit: 50 },
    {
      enabled: !!user && !!conversationId,
      refetchOnWindowFocus: false,
    },
  );

  // Fetch conversation details for header
  const { data: conversationData } = api.messages.getConversation.useQuery(
    { conversationId },
    {
      enabled: !!user && !!conversationId,
      refetchOnWindowFocus: false,
    },
  );

  // Update local state when data changes
  React.useEffect(() => {
    if (messagesData) {
      // Messages come in descending order (newest first), reverse for display
      setMessages(messagesData.messages.reverse());
      setIsLoading(false);
    }
  }, [messagesData]);

  // Set other participant from conversations data
  React.useEffect(() => {
    if (conversationData && user) {
      const conversation = conversationData;
      if (conversation) {
        const other =
          conversation.participant1.id === user.id
            ? conversation.participant2
            : conversation.participant1;
        setOtherParticipant(other);
      }
    }
  }, [conversationData, conversationId, user]);

  // Subscribe to real-time messages for this conversation
  React.useEffect(() => {
    if (!user || !client || !otherParticipant) return;

    const channelName = createPrivateChannelName(user.id, otherParticipant.id);
    const channel = client.channels.get(channelName);

    const handler = (message: Ably.Message) => {
      const data = message.data as {
        type: string;
        message: MessageWithDetails;
        timestamp: string;
      };

      if (data.type === "new_message") {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some((msg) => msg.id === data.message.id);
          if (exists) return prev;

          return [...prev, data.message];
        });
      }
    };

    void channel.subscribe("message", handler);

    return () => {
      void channel.unsubscribe("message", handler);
    };
  }, [user, client, otherParticipant]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = api.messages.sendMessage.useMutation({
    // No optimistic updates - rely on real-time channel for immediate updates
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  const handleSendMessage = React.useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      await sendMessageMutation.mutateAsync({
        conversationId,
        content: content.trim(),
        type: "text",
      });
    },
    [conversationId, sendMessageMutation],
  );

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-border/40 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="space-y-1">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "mb-4 flex",
                i % 2 === 0 ? "justify-start" : "justify-end",
              )}
            >
              <div
                className={cn(
                  "max-w-xs space-y-1",
                  i % 2 === 0 ? "items-start" : "items-end",
                )}
              >
                <div
                  className={cn(
                    "h-8 animate-pulse rounded-lg",
                    i % 2 === 0 ? "w-32 bg-muted" : "w-24 bg-primary/20",
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      {otherParticipant && (
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={otherParticipant.imageUrl ?? ""}
                alt={otherParticipant.name}
              />
              <AvatarFallback className="text-sm">
                {getInitials(otherParticipant.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-semibold">{otherParticipant.name}</h3>
              <p className="text-xs text-muted-foreground">
                @{otherParticipant.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-16">
              <div className="text-center">
                {otherParticipant && (
                  <>
                    <Avatar className="mx-auto mb-4 h-20 w-20">
                      <AvatarImage
                        src={otherParticipant.imageUrl ?? ""}
                        alt={otherParticipant.name}
                      />
                      <AvatarFallback className="text-2xl">
                        {getInitials(otherParticipant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mb-1 text-lg font-semibold">
                      {otherParticipant.name}
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      @{otherParticipant.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Say hello to start the conversation!
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => {
                const isOwn = message.senderId === user.id;
                const prevMessage = messages[index - 1];
                const nextMessage = messages[index + 1];
                const isLastInGroup =
                  !nextMessage || nextMessage.senderId !== message.senderId;
                const isFirstInGroup =
                  !prevMessage || prevMessage.senderId !== message.senderId;

                const timeSinceLastMessage = prevMessage
                  ? (safeParseDate(message.createdAt)?.getTime() ?? 0) -
                    (safeParseDate(prevMessage.createdAt)?.getTime() ?? 0)
                  : 0;
                const showTimestamp =
                  isFirstInGroup || timeSinceLastMessage > 300000; // 5 minutes

                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="flex justify-center py-4">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeToNow(message.createdAt)}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        "mb-1 flex gap-2",
                        isOwn ? "justify-end" : "justify-start",
                      )}
                    >
                      {!isOwn && (
                        <div className="flex-shrink-0">
                          {isLastInGroup ? (
                            <Avatar className="h-7 w-7">
                              <AvatarImage
                                src={message.sender.imageUrl ?? ""}
                                alt={message.sender.name}
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(message.sender.name)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-7 w-7" />
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-xs break-words rounded-2xl px-4 py-2 text-sm",
                          isOwn
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                          isOwn && isFirstInGroup && "rounded-tr-lg",
                          isOwn && isLastInGroup && "rounded-br-lg",
                          !isOwn && isFirstInGroup && "rounded-tl-lg",
                          !isOwn && isLastInGroup && "rounded-bl-lg",
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border/40 p-6">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          placeholder={
            otherParticipant
              ? `Message ${otherParticipant.name}...`
              : "Type a message..."
          }
        />
      </div>
    </div>
  );
}
