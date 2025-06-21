import { SmilePlus } from "lucide-react";
import { useState } from "react";
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
];

export function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
}: MessageReactionsProps) {
  const { user } = useUser();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
      // If user already has this specific emoji reaction, remove it (toggle off)
      onRemoveReaction(messageId);
    } else {
      // Add new reaction (this will replace any existing reaction due to unique constraint)
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
    <div className="mt-1 flex items-center gap-1">
      {/* Existing reactions */}
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
              "h-6 min-w-[2rem] rounded-full border px-2 py-0 text-xs transition-all hover:scale-105",
              userHasReacted
                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                : "border-border/40 bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
            title={reactionList.map((r) => r.user.name).join(", ")}
          >
            <span className="mr-1">{emoji}</span>
            <span className="text-[10px]">{count}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 rounded-full border border-dashed p-0 transition-all hover:scale-105",
              hasReactions ? "opacity-0 group-hover:opacity-100" : "",
              "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground hover:bg-muted/50",
            )}
          >
            <SmilePlus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start" side="top">
          <div className="grid grid-cols-5 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleEmojiSelect(emoji)}
                className="h-8 w-8 p-0 text-lg transition-all hover:scale-110 hover:bg-muted"
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
