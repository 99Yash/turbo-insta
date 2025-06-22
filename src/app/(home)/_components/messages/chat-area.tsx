"use client";

import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { ArrowLeft, Send, Smile } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { PresenceIndicator } from "~/components/ui/presence-indicator";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useAuthenticatedUser } from "~/contexts/user-context";
import {
  useConversationSubscription,
  type ReactionEventData,
} from "~/hooks/use-conversation-subscription";
import { usePresence } from "~/hooks/use-presence";
import { cn, getInitials, showErrorToast } from "~/lib/utils";
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

export function ChatArea({
  conversation,
  onUserSelect,
  onBack,
}: ChatAreaProps) {
  const user = useAuthenticatedUser();
  const [showNewMessageModal, setShowNewMessageModal] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Initialize presence tracking
  const { isUserOnline } = usePresence();

  // Real-time message updates state with metadata for cleanup
  const [realtimeMessages, setRealtimeMessages] = React.useState<
    Map<string, MessageWithSender & { addedAt: number }>
  >(new Map());

  // Constants for memory management
  const MAX_REALTIME_MESSAGES = 10; // Maximum number of messages to keep in memory
  const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000; // 5 minutes - messages older than this will be removed

  /**
   * Cleans up old and excess messages from the realtime messages map
   */
  const cleanupRealtimeMessages = React.useCallback(
    (currentMap: Map<string, MessageWithSender & { addedAt: number }>) => {
      const now = Date.now();
      const entries = Array.from(currentMap.entries());

      // Filter out messages that are too old
      const recentEntries = entries.filter(
        ([, messageWithMeta]) =>
          now - messageWithMeta.addedAt <= MAX_MESSAGE_AGE_MS,
      );

      // If we still have too many messages, keep only the most recent ones
      const limitedEntries = recentEntries
        .sort(([, a], [, b]) => b.addedAt - a.addedAt) // Sort by addedAt descending
        .slice(0, MAX_REALTIME_MESSAGES);

      // Return a new map with cleaned entries
      const cleanedMap = new Map(limitedEntries);

      return cleanedMap;
    },
    [MAX_REALTIME_MESSAGES, MAX_MESSAGE_AGE_MS],
  );

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.messages.getConversationMessages.useInfiniteQuery(
    {
      conversationId: conversation?.id ?? "",
      limit: 50,
    },
    {
      enabled: !!conversation?.id,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const markAsReadMutation = api.messages.markConversationAsRead.useMutation();
  const utils = api.useUtils();

  // Derive final messages list combining server data with real-time updates
  const messages = React.useMemo(() => {
    const allServerMessages =
      messagesData?.pages?.flatMap((page) => page.messages) ?? [];

    if (allServerMessages.length === 0 && realtimeMessages.size === 0) {
      return [];
    }

    const messagesMap = new Map<string, MessageWithSender>();

    // Add server messages
    allServerMessages.forEach((msg) => {
      messagesMap.set(msg.id, msg);
    });

    // Apply real-time updates (strip addedAt metadata when deriving final messages)
    realtimeMessages.forEach((updateWithMeta, id) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { addedAt, ...update } = updateWithMeta;
      messagesMap.set(id, update as MessageWithSender);
    });

    const finalMessages = Array.from(messagesMap.values()).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return finalMessages;
  }, [messagesData?.pages, realtimeMessages]);

  // Clear real-time messages when conversation changes
  React.useEffect(() => {
    setRealtimeMessages(new Map());
  }, [conversation?.id]);

  // Periodic cleanup of old real-time messages
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeMessages((prev) => {
        if (prev.size === 0) return prev;
        const cleaned = cleanupRealtimeMessages(prev);
        return cleaned.size !== prev.size ? cleaned : prev;
      });
    }, 30000); // Clean up every 30 seconds

    return () => clearInterval(interval);
  }, [cleanupRealtimeMessages]);

  // Mark conversation as read when opened
  React.useEffect(() => {
    if (conversation?.id && conversation.unreadCount > 0) {
      markAsReadMutation.mutate(
        { conversationId: conversation.id },
        {
          onSuccess: () => {
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

  // Auto-scroll to bottom when messages change, but only if user is near the bottom
  React.useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && !isFetchingNextPage) {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement | null;

      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const scrollThreshold = 100; // pixels from bottom to consider "near bottom"
        const isNearBottom =
          scrollTop + clientHeight >= scrollHeight - scrollThreshold;

        // Only auto-scroll if user is near the bottom
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        // Fallback: if we can't get scroll position, auto-scroll (initial load case)
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length, isFetchingNextPage]);

  // Handle scroll to top for loading more messages
  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = event.currentTarget;

      // If scrolled to top and we have more messages to load
      if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  // Handle real-time message updates using custom hook
  const handleMessageReceived = React.useCallback(
    (message: MessageWithSender) => {
      const messageWithTimestamp = {
        ...message,
        addedAt: Date.now(),
      };

      setRealtimeMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(message.id, messageWithTimestamp);
        // Clean up old/excess messages after adding new one
        return cleanupRealtimeMessages(newMap);
      });
    },
    [cleanupRealtimeMessages],
  );

  const handleReactionUpdated = React.useCallback(
    (reactionData: ReactionEventData) => {
      if (reactionData.messageId) {
        if (reactionData.type === "reaction_added") {
          // Add reaction to the message
          setRealtimeMessages((prev) => {
            const newMap = new Map(prev);

            // Find the message to update (from real-time state only)
            // If the message isn't in real-time state, the server will handle the reaction
            // and it will be included in future fetches
            const messageToUpdate = newMap.get(reactionData.messageId);

            if (messageToUpdate) {
              const updatedMessage = {
                ...messageToUpdate,
                reactions: [
                  // Remove any existing reaction from this user first
                  ...messageToUpdate.reactions.filter(
                    (r) => r.userId !== reactionData.reaction.userId,
                  ),
                  // Add the new reaction
                  reactionData.reaction,
                ],
                addedAt: messageToUpdate.addedAt, // Preserve the addedAt timestamp
              };
              newMap.set(reactionData.messageId, updatedMessage);
            }

            return newMap;
          });
        } else if (reactionData.type === "reaction_removed") {
          // Remove user's reaction from the message
          setRealtimeMessages((prev) => {
            const newMap = new Map(prev);

            // Find the message to update (from real-time state only)
            const messageToUpdate = newMap.get(reactionData.messageId);

            if (messageToUpdate) {
              const updatedMessage = {
                ...messageToUpdate,
                reactions: messageToUpdate.reactions.filter(
                  (r) => r.userId !== reactionData.userId,
                ),
                addedAt: messageToUpdate.addedAt, // Preserve the addedAt timestamp
              };
              newMap.set(reactionData.messageId, updatedMessage);
            }

            return newMap;
          });
        }
      }
    },
    [],
  );

  // Use custom hook for real-time subscription
  useConversationSubscription({
    conversationId: conversation?.id,
    onMessageReceived: handleMessageReceived,
    onReactionUpdated: handleReactionUpdated,
  });

  const sendMessageMutation = api.messages.sendMessage.useMutation({
    onSuccess: (sentMessage) => {
      setMessageText("");

      // Add to real-time messages for immediate display
      setRealtimeMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(sentMessage.id, {
          ...sentMessage,
          addedAt: Date.now(),
        });
        // Clean up old/excess messages after adding new one
        return cleanupRealtimeMessages(newMap);
      });

      // Maintain focus on the textarea after sending - use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
    onError: (error) => {
      showErrorToast(error);
      console.error("❌ [ChatArea] Failed to send message:", error);
    },
  });

  const addReactionMutation = api.messages.addReaction.useMutation({
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const removeReactionMutation = api.messages.removeReaction.useMutation({
    onError: (error) => {
      showErrorToast(error);
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
    if (!messageText.trim() || !conversation || sendMessageMutation.isPending)
      return;

    const otherParticipant = getOtherParticipant(conversation);
    sendMessageMutation.mutate({
      receiverId: otherParticipant.id,
      text: messageText.trim(),
    });
  }, [messageText, conversation, getOtherParticipant, sendMessageMutation]);

  // Group consecutive messages by the same sender
  const groupedMessages = React.useMemo(() => {
    const groups = messages.reduce((groups, message, index) => {
      const isFirstMessage = index === 0;
      const prevMessage = messages[index - 1];
      const isNewGroup =
        isFirstMessage || prevMessage?.senderId !== message.senderId;

      if (isNewGroup) {
        groups.push([message]);
      } else {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup) {
          lastGroup.push(message);
        } else {
          // Defensive fallback: create a new group if lastGroup is undefined
          groups.push([message]);
        }
      }

      return groups;
    }, [] as MessageWithSender[][]);

    // Filter out any empty groups as a defensive measure
    return groups.filter((group) => group.length > 0);
  }, [messages]);

  const handleEmojiSelect = React.useCallback(
    (emojiData: EmojiClickData) => {
      const emoji = emojiData.emoji;
      const textarea = textareaRef.current;

      if (textarea) {
        // Get selection values and validate them with bounds checking
        const rawStart = textarea.selectionStart;
        const rawEnd = textarea.selectionEnd;

        // Ensure values are not null and clamp them to valid range
        const maxLength = messageText.length;
        const start = Math.max(0, Math.min(rawStart ?? 0, maxLength));
        const end = Math.max(0, Math.min(rawEnd ?? maxLength, maxLength));

        // Ensure start is not greater than end
        const validStart = Math.min(start, end);
        const validEnd = Math.max(start, end);

        const newText =
          messageText.slice(0, validStart) +
          emoji +
          messageText.slice(validEnd);

        setMessageText(newText);

        // Set cursor position after the emoji
        setTimeout(() => {
          const newCursorPosition = validStart + emoji.length;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          textarea.focus();
        }, 0);
      } else {
        // Fallback: append emoji to the end
        setMessageText((prev) => prev + emoji);
      }

      setShowEmojiPicker(false);
    },
    [messageText],
  );

  /**
   * Check if a message contains only emojis (and optional whitespace)
   */
  const isEmojiOnlyMessage = React.useCallback((text: string): boolean => {
    const trimmedText = text.trim();
    if (!trimmedText) return false;

    const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\s]*$/u;

    const hasEmoji = /\p{Emoji}/u.test(trimmedText);

    return emojiRegex.test(trimmedText) && hasEmoji;
  }, []);

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
            className="bg-primary text-primary-foreground hover:bg-primary/90"
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
  const isOtherUserOnline = isUserOnline(otherParticipant.id);

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

          {/* Avatar with presence indicator */}
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarImage
                src={otherParticipant.imageUrl ?? undefined}
                alt={otherParticipant.name}
              />
              <AvatarFallback>
                {getInitials(otherParticipant.name)}
              </AvatarFallback>
            </Avatar>
            <PresenceIndicator isOnline={isOtherUserOnline} size="sm" />
          </div>

          <div>
            <h3 className="font-semibold">{otherParticipant.username}</h3>
            {isOtherUserOnline && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Online
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages area - Enhanced styling */}
      <ScrollArea
        className="flex-1 bg-gradient-to-b from-background to-muted/20"
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}
      >
        <div className="flex flex-col gap-2 p-4">
          {/* Load more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Loading more messages...
              </div>
            </div>
          )}

          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
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
              // Defensive guard: skip empty groups (shouldn't happen with our logic, but safety first)
              if (messageGroup.length === 0) {
                return null;
              }

              const firstMessage = messageGroup[0]!; // Safe after length check
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
                      <div className="mb-1 text-sm font-semibold text-primary">
                        {sender.username.toUpperCase()}
                      </div>
                    )}

                    {/* Message bubbles */}
                    <div className="flex flex-col gap-1">
                      {messageGroup.map((message, messageIndex) => {
                        const isLastInGroup =
                          messageIndex === messageGroup.length - 1;
                        const isEmojiOnly = isEmojiOnlyMessage(message.text);

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
                                "max-w-full break-words text-sm transition-all",
                                isEmojiOnly
                                  ? "px-1 py-1 text-3xl leading-none" // Large emoji display without background
                                  : cn(
                                      "px-4 py-2 shadow-sm",
                                      isOwnGroup
                                        ? cn(
                                            "rounded-2xl bg-primary text-primary-foreground",
                                            messageIndex === 0 &&
                                              "rounded-tr-lg",
                                            isLastInGroup && "rounded-br-lg",
                                          )
                                        : cn(
                                            "rounded-2xl border border-border/20 bg-muted/60 text-foreground",
                                            messageIndex === 0 &&
                                              "rounded-tl-lg",
                                            isLastInGroup && "rounded-bl-lg",
                                          ),
                                    ),
                              )}
                            >
                              <span
                                className={cn(
                                  isEmojiOnly
                                    ? "block"
                                    : "whitespace-pre-wrap leading-relaxed",
                                )}
                              >
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

      {/* Message input - Instagram-style layout */}
      <div className="border-t border-border/40 bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          {/* Message input area with embedded buttons */}
          <div className="flex flex-1 items-center rounded-2xl border border-border/20 bg-muted/50 transition-colors focus-within:border-border/40">
            {/* Emoji picker button */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto border-border/40 p-0 shadow-lg"
                align="start"
                side="top"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme={Theme.AUTO}
                  width={350}
                  height={400}
                  previewConfig={{
                    showPreview: false,
                  }}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  autoFocusSearch={false}
                />
              </PopoverContent>
            </Popover>

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
              rows={1}
              aria-label="Type your message"
              aria-describedby="message-help"
              className="max-h-32 min-h-[2.75rem] flex-1 resize-none bg-transparent px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <div id="message-help" className="sr-only">
              Press Enter to send, Shift+Enter for new line
            </div>

            {/* Send text button - Instagram style */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              aria-label="Send message"
              className="mr-2 h-8 px-3 text-sm font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:hover:text-muted-foreground"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
