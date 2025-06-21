"use client";

import type * as Ably from "ably";
import { useAbly } from "ably/react";
import { ArrowLeft, Plus, Send } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useAuthenticatedUser } from "~/contexts/user-context";
import { cn, getInitials } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { MessageReactions } from "./message-reactions";
import { NewMessageModal } from "./new-message-modal";

// Use inferred types from router outputs
type ConversationWithParticipants =
  RouterOutputs["messages"]["getOrCreateConversation"];
type MessageWithSender =
  RouterOutputs["messages"]["getConversationMessages"]["messages"][number];

interface ChatAreaProps {
  readonly conversation?: ConversationWithParticipants;
  readonly onUserSelect?: (userId: string) => void;
  readonly onBack?: () => void;
}

type MessageEventData = {
  readonly type: "new_message";
  readonly message: RouterOutputs["messages"]["sendMessage"];
  readonly conversationId: string;
  readonly timestamp: string;
};

type ReactionEventData = {
  readonly type: "reaction_added" | "reaction_removed";
  readonly messageId: string;
  readonly reaction?: {
    readonly id: string;
    readonly emoji: string;
    readonly userId: string;
    readonly messageId?: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date | null;
    readonly user: {
      readonly id: string;
      readonly name: string;
      readonly username: string;
    };
  };
  readonly userId?: string;
  readonly timestamp: Date;
};

export function ChatArea({
  conversation,
  onUserSelect,
  onBack,
}: ChatAreaProps) {
  const user = useAuthenticatedUser();
  const [showNewMessageModal, setShowNewMessageModal] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const client = useAbly();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Real-time message updates state
  const [realtimeMessages, setRealtimeMessages] = React.useState<
    Map<string, MessageWithSender>
  >(new Map());

  const { data: messagesData, isLoading: isLoadingMessages } =
    api.messages.getConversationMessages.useQuery(
      {
        conversationId: conversation?.id ?? "",
        limit: 50,
      },
      {
        enabled: !!conversation?.id,
      },
    );

  const markAsReadMutation = api.messages.markConversationAsRead.useMutation();
  const utils = api.useUtils();

  // Derive final messages list combining server data with real-time updates
  const messages = React.useMemo(() => {
    if (!messagesData?.messages?.length && realtimeMessages.size === 0) {
      return [];
    }

    const messagesMap = new Map<string, MessageWithSender>();

    // Add server messages
    messagesData?.messages?.forEach((msg) => {
      messagesMap.set(msg.id, msg);
    });

    // Apply real-time updates
    realtimeMessages.forEach((update, id) => {
      messagesMap.set(id, update);
    });

    const finalMessages = Array.from(messagesMap.values()).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return finalMessages;
  }, [messagesData?.messages, realtimeMessages]);

  // Clear real-time messages when conversation changes
  React.useEffect(() => {
    setRealtimeMessages(new Map());
  }, [conversation?.id]);

  // Mark conversation as read when opened
  React.useEffect(() => {
    if (conversation?.id && conversation.unreadCount > 0) {
      console.log(
        `📖 [ChatArea] Marking conversation as read:`,
        conversation.id,
      );
      markAsReadMutation.mutate(
        { conversationId: conversation.id },
        {
          onSuccess: () => {
            console.log(
              `✅ [ChatArea] Conversation marked as read:`,
              conversation.id,
            );
            // Invalidate conversations to update unread counts
            void utils.messages.getConversations.invalidate();
          },
          onError: (error) => {
            console.error(
              `❌ [ChatArea] Failed to mark conversation as read:`,
              error,
            );
          },
        },
      );
    }
  }, [
    conversation?.id,
    conversation?.unreadCount,
    markAsReadMutation,
    utils.messages.getConversations,
  ]);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Subscribe to real-time messages for this conversation
  React.useEffect(() => {
    if (!conversation?.id || !client) {
      return;
    }

    const conversationChannelName = `conversation:${conversation.id}`;
    const channel = client.channels.get(conversationChannelName);

    const messageHandler = (message: Ably.Message) => {
      const data = message.data as MessageEventData;

      if (
        data?.type === "new_message" &&
        data?.conversationId === conversation.id &&
        data.message
      ) {
        // Normalize the message to ensure dates are Date objects
        const normalizedMessage = {
          ...data.message,
          createdAt: new Date(data.message.createdAt),
          updatedAt: data.message.updatedAt
            ? new Date(data.message.updatedAt)
            : null,
        };

        setRealtimeMessages((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.message.id, normalizedMessage);
          return newMap;
        });
      }
    };

    const reactionHandler = (message: Ably.Message) => {
      const data = message.data as ReactionEventData;

      console.log("🎯 [ChatArea] Received reaction event:", data);

      if (data?.messageId) {
        if (data.type === "reaction_added" && data.reaction) {
          console.log("➕ [ChatArea] Adding reaction:", data.reaction);
          // Add reaction to the message
          setRealtimeMessages((prev) => {
            const newMap = new Map(prev);

            // Find the message to update (from either real-time state or server data)
            let messageToUpdate = newMap.get(data.messageId);

            // If message isn't in real-time state, get it from server data
            messageToUpdate ??= messagesData?.messages?.find(
              (m) => m.id === data.messageId,
            );

            if (messageToUpdate) {
              const updatedMessage = {
                ...messageToUpdate,
                reactions: [
                  // Remove any existing reaction from this user first
                  ...messageToUpdate.reactions.filter(
                    (r) => r.userId !== data.reaction!.userId,
                  ),
                  // Add the new reaction
                  data.reaction!,
                ],
              };
              newMap.set(data.messageId, updatedMessage);
              console.log(
                "✅ [ChatArea] Reaction added successfully to message:",
                data.messageId,
              );
            } else {
              console.warn("⚠️ [ChatArea] Message not found for reaction:", {
                messageId: data.messageId,
                hasRealtimeMessages: newMap.size > 0,
                hasServerMessages: (messagesData?.messages?.length ?? 0) > 0,
              });
            }

            return newMap;
          });
        } else if (data.type === "reaction_removed" && data.userId) {
          console.log("🗑️ [ChatArea] Removing reaction:", {
            messageId: data.messageId,
            userId: data.userId,
          });
          // Remove user's reaction from the message
          setRealtimeMessages((prev) => {
            const newMap = new Map(prev);

            // Find the message to update (from either real-time state or server data)
            let messageToUpdate = newMap.get(data.messageId);

            // If message isn't in real-time state, get it from server data
            messageToUpdate ??= messagesData?.messages?.find(
              (m) => m.id === data.messageId,
            );

            if (messageToUpdate) {
              const updatedMessage = {
                ...messageToUpdate,
                reactions: messageToUpdate.reactions.filter(
                  (r) => r.userId !== data.userId,
                ),
              };
              newMap.set(data.messageId, updatedMessage);
              console.log(
                "✅ [ChatArea] Reaction removed successfully from message:",
                data.messageId,
              );
            } else {
              console.warn(
                "⚠️ [ChatArea] Message not found for reaction removal:",
                {
                  messageId: data.messageId,
                  hasRealtimeMessages: newMap.size > 0,
                  hasServerMessages: (messagesData?.messages?.length ?? 0) > 0,
                },
              );
            }

            return newMap;
          });
        }
      }
    };

    // Subscribe with error handling
    channel.subscribe("message", messageHandler).catch((error) => {
      console.error("❌ Failed to subscribe to message events:", error);
    });

    channel.subscribe("reaction", reactionHandler).catch((error) => {
      console.error("❌ Failed to subscribe to reaction events:", error);
    });

    console.log(
      `✅ [ChatArea] Subscribed to channel: ${conversationChannelName}`,
    );

    return () => {
      void channel.unsubscribe("message", messageHandler);
      void channel.unsubscribe("reaction", reactionHandler);
    };
  }, [conversation?.id, client, messagesData?.messages]); // Include messagesData for reaction handling

  const sendMessageMutation = api.messages.sendMessage.useMutation({
    onSuccess: (sentMessage) => {
      setMessageText("");

      // Add to real-time messages for immediate display
      setRealtimeMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(sentMessage.id, sentMessage);
        return newMap;
      });

      // Maintain focus on the textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
  });

  // Add optimistic updates for immediate feedback
  const addReactionMutation = api.messages.addReaction.useMutation({
    onMutate: ({ messageId, emoji }) => {
      console.log("🔄 [ChatArea] Optimistically adding reaction:", {
        messageId,
        emoji,
      });
    },
    onError: (error, { messageId, emoji }) => {
      console.error("❌ [ChatArea] Failed to add reaction:", {
        messageId,
        emoji,
        error,
      });
    },
  });

  const removeReactionMutation = api.messages.removeReaction.useMutation({
    onMutate: ({ messageId }) => {
      console.log("🔄 [ChatArea] Optimistically removing reaction:", {
        messageId,
      });
    },
    onError: (error, { messageId }) => {
      console.error("❌ [ChatArea] Failed to remove reaction:", {
        messageId,
        error,
      });
    },
  });

  const handleAddReaction = React.useCallback(
    (messageId: string, emoji: string) => {
      addReactionMutation.mutate({ messageId, emoji });
    },
    [addReactionMutation],
  );

  const handleRemoveReaction = React.useCallback(
    (messageId: string) => {
      removeReactionMutation.mutate({ messageId });
    },
    [removeReactionMutation],
  );

  const handleUserSelect = React.useCallback(
    (userId: string) => {
      onUserSelect?.(userId);
    },
    [onUserSelect],
  );

  /**
   * Get the participant who is NOT the current user
   */
  const getOtherParticipant = React.useCallback(
    (conversation: ConversationWithParticipants) => {
      return conversation.participant1.id === user?.id
        ? conversation.participant2
        : conversation.participant1;
    },
    [user?.id],
  );

  const handleSendMessage = React.useCallback(() => {
    if (!messageText.trim() || !conversation) return;

    const otherParticipant = getOtherParticipant(conversation);
    sendMessageMutation.mutate({
      receiverId: otherParticipant.id,
      text: messageText.trim(),
    });
  }, [messageText, conversation, getOtherParticipant, sendMessageMutation]);

  // Group consecutive messages by the same sender
  const groupedMessages = React.useMemo(() => {
    return messages.reduce((groups, message, index) => {
      const isFirstMessage = index === 0;
      const prevMessage = messages[index - 1];
      const isNewGroup =
        isFirstMessage || prevMessage?.senderId !== message.senderId;

      if (isNewGroup) {
        groups.push([message]);
      } else {
        groups[groups.length - 1]!.push(message);
      }

      return groups;
    }, [] as MessageWithSender[][]);
  }, [messages]);

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

          {/* New Message Modal */}
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

  return (
    <div className="flex h-screen flex-1 flex-col bg-background">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border/40 bg-background/80 p-4 backdrop-blur-sm">
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

          {/* Single avatar for 1-on-1 conversation */}
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage
              src={otherParticipant.imageUrl ?? undefined}
              alt={otherParticipant.name}
            />
            <AvatarFallback>
              {getInitials(otherParticipant.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-semibold">{otherParticipant.username}</h3>
          </div>
        </div>
      </div>

      {/* Messages area - Enhanced styling */}
      <ScrollArea
        className="flex-1 bg-gradient-to-b from-background to-muted/20"
        ref={scrollAreaRef}
      >
        <div className="flex flex-col gap-2 p-4">
          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">
                Loading messages...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Avatar className="mb-4 h-16 w-16">
                <AvatarImage
                  src={otherParticipant.imageUrl ?? undefined}
                  alt={otherParticipant.name}
                />
                <AvatarFallback>
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
            groupedMessages.map((messageGroup, groupIndex) => {
              const firstMessage = messageGroup[0]!;
              const isOwnGroup = firstMessage.senderId === user?.id;
              const sender = firstMessage.sender;

              return (
                <div
                  key={`group-${groupIndex}`}
                  className={cn(
                    "group/message relative mb-6 flex gap-3",
                    isOwnGroup ? "justify-end" : "justify-start",
                  )}
                >
                  {/* Avatar for incoming message groups */}
                  {!isOwnGroup && (
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10 border border-border/30">
                        <AvatarImage
                          src={sender.imageUrl ?? undefined}
                          alt={sender.name}
                        />
                        <AvatarFallback>
                          {getInitials(sender.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex max-w-[75%] flex-col",
                      isOwnGroup ? "items-end" : "items-start",
                    )}
                  >
                    {/* Sender name for incoming messages - ABOVE the first bubble */}
                    {!isOwnGroup && (
                      <div className="mb-1 text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {sender.username.toUpperCase()}
                      </div>
                    )}

                    {/* Message bubbles */}
                    <div className="flex flex-col gap-1">
                      {messageGroup.map((message, messageIndex) => {
                        const isLastInGroup =
                          messageIndex === messageGroup.length - 1;

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "relative",
                              isOwnGroup
                                ? "flex flex-col items-end"
                                : "flex flex-col items-start",
                            )}
                          >
                            {/* Message bubble */}
                            <div
                              className={cn(
                                "max-w-full break-words px-4 py-2 text-sm shadow-sm transition-all",
                                isOwnGroup
                                  ? cn(
                                      "rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white",
                                      messageIndex === 0 && "rounded-tr-lg",
                                      isLastInGroup && "rounded-br-lg",
                                    )
                                  : cn(
                                      "rounded-2xl border border-border/20 bg-muted/60 text-foreground",
                                      messageIndex === 0 && "rounded-tl-lg",
                                      isLastInGroup && "rounded-bl-lg",
                                    ),
                              )}
                            >
                              <span className="whitespace-pre-wrap leading-relaxed">
                                {message.text}
                              </span>
                            </div>

                            {/* Message reactions */}
                            <MessageReactions
                              messageId={message.id}
                              reactions={message.reactions}
                              onAddReaction={handleAddReaction}
                              onRemoveReaction={handleRemoveReaction}
                              isOwnMessage={isOwnGroup}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Spacer for outgoing messages to maintain alignment */}
                  {isOwnGroup && <div className="h-10 w-10 flex-shrink-0" />}
                </div>
              );
            })
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input - Enhanced styling */}
      <div className="border-t border-border/40 bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          {/* Attachment button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 flex-shrink-0 rounded-full p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted hover:text-foreground active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* Message input area */}
          <div className="flex flex-1 items-end rounded-2xl border border-border/40 bg-background/50 shadow-sm">
            <textarea
              ref={textareaRef}
              autoFocus
              placeholder="Message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sendMessageMutation.isPending}
              rows={1}
              className="max-h-32 min-h-[2.5rem] w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />

            {/* Send button */}
            {messageText.trim() && (
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                className="mr-2 h-8 w-8 flex-shrink-0 rounded-full bg-red-500 p-0 text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-red-600 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
