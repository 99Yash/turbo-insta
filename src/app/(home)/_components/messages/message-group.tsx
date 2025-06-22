"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn, getInitials } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { MessageReactions } from "./message-reactions";

type MessageWithSender =
  RouterOutputs["messages"]["getConversationMessages"]["messages"][number];

interface MessageGroupProps {
  readonly messageGroup: MessageWithSender[];
  readonly currentUserId: string;
  readonly onAddReaction: (messageId: string, emoji: string) => void;
  readonly onRemoveReaction: (messageId: string) => void;
}

export function MessageGroup({
  messageGroup,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
}: MessageGroupProps) {
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

  // Defensive guard: skip empty groups
  if (messageGroup.length === 0) {
    return null;
  }

  const firstMessage = messageGroup[0]!; // Safe after length check
  const isOwnGroup = firstMessage.senderId === currentUserId;
  const sender = firstMessage.sender;

  return (
    <div
      className={cn(
        "group/message relative mb-6 flex gap-3",
        isOwnGroup ? "justify-end" : "justify-start",
      )}
    >
      {/* Avatar for incoming message groups */}
      {!isOwnGroup && (
        <div className="flex-shrink-0">
          <Avatar className="h-10 w-10 border border-border/30">
            <AvatarImage src={sender.imageUrl ?? undefined} alt={sender.name} />
            <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
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
            const isLastInGroup = messageIndex === messageGroup.length - 1;
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
                                messageIndex === 0 && "rounded-tr-lg",
                                isLastInGroup && "rounded-br-lg",
                              )
                            : cn(
                                "rounded-2xl border border-border/20 bg-muted/60 text-foreground",
                                messageIndex === 0 && "rounded-tl-lg",
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
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
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
}
