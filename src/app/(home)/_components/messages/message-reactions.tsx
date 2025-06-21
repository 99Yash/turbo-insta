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

interface MessageReactionsProps {
  readonly messageId: string;
  readonly reactions: Array<{
    readonly id: string;
    readonly emoji: string;
    readonly userId: string;
    readonly user: {
      readonly id: string;
      readonly name: string;
      readonly username: string;
    };
  }>;
  readonly onAddReaction: (messageId: string, emoji: string) => void;
  readonly onRemoveReaction: (messageId: string) => void;
}

const EMOJI_OPTIONS = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "👍",
  "👎",
  "🔥",
  "💯",
  "✨",
  "💪",
  "🎉",
  "😍",
  "🤔",
  "👏",
];

export function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
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

  const handleEmojiSelect = (emoji: string) => {
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

  if (!hasReactions) {
    return (
      <div className="group/reactions mt-1 flex items-center justify-start">
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0 opacity-0 transition-all duration-200 hover:scale-105 hover:bg-muted/80 hover:opacity-100 group-hover/message:opacity-60"
            >
              <SmilePlus className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border-border/40 p-3 shadow-lg"
            align="start"
            side="top"
          >
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="h-10 w-10 rounded-lg p-0 text-lg transition-all duration-200 hover:scale-110 hover:bg-muted/60"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="group/reactions mt-2 flex items-center gap-1">
      {/* Existing reactions with enhanced styling */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userHasReacted = reactionList.some((r) => r.userId === user?.id);
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
            title={`${reactionList.map((r) => r.user.name).join(", ")} reacted with ${emoji}`}
          >
            <span className="text-sm">{emoji}</span>
            {count > 1 && (
              <span className="ml-1 text-[11px] font-semibold">{count}</span>
            )}
          </Button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-full border border-dashed border-muted-foreground/30 p-0 opacity-60 transition-all duration-200 hover:scale-105 hover:bg-muted/80 hover:opacity-100"
          >
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto border-border/40 p-3 shadow-lg"
          align="start"
          side="top"
        >
          <div className="grid grid-cols-5 gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleEmojiSelect(emoji)}
                className="h-10 w-10 rounded-lg p-0 text-lg transition-all duration-200 hover:scale-110 hover:bg-muted/60"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
