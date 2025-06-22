import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { SmilePlus } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useUser } from "~/contexts/user-context";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";

interface MessageReactionsProps {
  readonly messageId: string;
  readonly reactions: RouterOutputs["messages"]["getConversationMessages"]["messages"][number]["reactions"];
  readonly onAddReaction: (messageId: string, emoji: string) => void;
  readonly onRemoveReaction: (messageId: string) => void;
  readonly isOwnMessage?: boolean;
}

export function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
  isOwnMessage = false,
}: MessageReactionsProps) {
  const { user } = useUser();
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] ??= [];
      acc[reaction.emoji]!.push(reaction);
      return acc;
    },
    {} as Record<string, typeof reactions>,
  );

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const userReaction = reactions.find(
      (r) => r.userId === user?.id && r.emoji === emoji,
    );

    if (userReaction) {
      onRemoveReaction(messageId);
    } else {
      onAddReaction(messageId, emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleReactionClick = (emoji: string) => {
    const userReaction = reactions.find(
      (r) => r.userId === user?.id && r.emoji === emoji,
    );

    if (userReaction) {
      onRemoveReaction(messageId);
    } else {
      onAddReaction(messageId, emoji);
    }
  };

  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <div className="flex items-center">
      {/* Reactions that appear below the message when they exist */}
      {hasReactions && (
        <div className="mt-1 flex items-center gap-1">
          {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
            const userHasReacted = reactionList.some(
              (r) => r.userId === user?.id,
            );
            const count = reactionList.length;

            return (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleReactionClick(emoji)}
                className={cn(
                  "h-7 min-w-[2.5rem] rounded-full px-2.5 py-0 text-xs font-medium shadow-sm transition-all duration-200 hover:scale-105",
                  userHasReacted
                    ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700/50",
                )}
                title={
                  userHasReacted
                    ? reactionList.length === 1
                      ? `You reacted with ${emoji}. Click to remove your reaction.`
                      : `You and ${reactionList
                          .filter((r) => r.userId !== user?.id)
                          .map((r) => r.user.name)
                          .join(
                            ", ",
                          )} reacted with ${emoji}. Click to remove your reaction.`
                    : `${reactionList.map((r) => r.user.name).join(", ")} reacted with ${emoji}. Click to add your reaction.`
                }
              >
                <span className="text-sm">{emoji}</span>
                {count > 1 && (
                  <span className="ml-1 text-xs font-semibold">{count}</span>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* Add reaction button that appears inline on hover */}
      <div
        className={cn(
          "absolute flex items-center opacity-0 transition-all duration-200 group-hover/message:opacity-100",
          isOwnMessage
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-right-12 top-1/2 -translate-y-1/2",
        )}
      >
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full border border-dashed border-muted-foreground/30 bg-background/80 p-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-muted-foreground/50 hover:bg-muted/80 hover:shadow-lg"
            >
              <SmilePlus className="h-4 w-4 text-muted-foreground" />
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
      </div>
    </div>
  );
}
