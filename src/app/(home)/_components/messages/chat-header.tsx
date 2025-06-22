"use client";

import { ArrowLeft } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { PresenceIndicator } from "~/components/ui/presence-indicator";
import { usePresence } from "~/hooks/use-presence";
import { getInitials } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";

type ConversationWithParticipants =
  RouterOutputs["messages"]["getOrCreateConversation"];

interface ChatHeaderProps {
  readonly conversation: ConversationWithParticipants;
  readonly currentUserId: string;
  readonly onBack?: () => void;
}

export function ChatHeader({
  conversation,
  currentUserId,
  onBack,
}: ChatHeaderProps) {
  const { isUserOnline } = usePresence();

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

  const otherParticipant = getOtherParticipant(conversation);
  const isOtherUserOnline = isUserOnline(otherParticipant.id);

  return (
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
            <p className="text-sm text-green-600 dark:text-green-400">Online</p>
          )}
        </div>
      </div>
    </div>
  );
}
