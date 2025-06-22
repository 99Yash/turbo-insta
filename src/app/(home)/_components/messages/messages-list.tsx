"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ScrollArea } from "~/components/ui/scroll-area";
import { getInitials } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { MessageGroup } from "./message-group";

type ConversationWithParticipants =
  RouterOutputs["messages"]["getOrCreateConversation"];
type MessageWithSender =
  RouterOutputs["messages"]["getConversationMessages"]["messages"][number];

interface MessagesListProps {
  readonly conversation: ConversationWithParticipants;
  readonly currentUserId: string;
  readonly messages: MessageWithSender[];
  readonly isLoadingMessages: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  readonly onAddReaction: (messageId: string, emoji: string) => void;
  readonly onRemoveReaction: (messageId: string) => void;
  readonly scrollAreaRef: React.RefObject<HTMLDivElement>;
  readonly messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessagesList({
  conversation,
  currentUserId,
  messages,
  isLoadingMessages,
  isFetchingNextPage,
  hasNextPage,
  onScroll,
  onAddReaction,
  onRemoveReaction,
  scrollAreaRef,
  messagesEndRef,
}: MessagesListProps) {
  /**
   * Get the participant who is NOT the current user
   */
  const getOtherParticipant = React.useCallback(
    (conversation: ConversationWithParticipants) => {
      return conversation.participant1.id === currentUserId
        ? conversation.participant2
        : conversation.participant1;
    },
    [currentUserId],
  );

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

  const otherParticipant = getOtherParticipant(conversation);

  return (
    <ScrollArea
      className="flex-1 bg-gradient-to-b from-background to-muted/20"
      ref={scrollAreaRef}
      onScrollCapture={onScroll}
    >
      <div className="flex flex-col gap-2 p-4">
        {/* Load more indicator - always show at top when there are more messages */}
        {hasNextPage && !isLoadingMessages && (
          <div className="flex justify-center py-2">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Loading more messages...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <div className="h-1 w-1 rounded-full bg-muted-foreground/50"></div>
                Scroll up to load more messages
                <div className="h-1 w-1 rounded-full bg-muted-foreground/50"></div>
              </div>
            )}
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading messages...</p>
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
            <h4 className="mb-2 font-semibold">{otherParticipant.username}</h4>
            <p className="text-sm text-muted-foreground">
              Start a conversation with {otherParticipant.username}
            </p>
          </div>
        ) : (
          groupedMessages.map((messageGroup, groupIndex) => (
            <MessageGroup
              key={`group-${groupIndex}`}
              messageGroup={messageGroup}
              currentUserId={currentUserId}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
            />
          ))
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
