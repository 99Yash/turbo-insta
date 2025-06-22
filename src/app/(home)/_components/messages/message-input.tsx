"use client";

import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

interface MessageInputProps {
  readonly messageText: string;
  readonly onMessageTextChange: (text: string) => void;
  readonly onSendMessage: () => void;
  readonly isSending: boolean;
}

export function MessageInput({
  messageText,
  onMessageTextChange,
  onSendMessage,
  isSending,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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

        onMessageTextChange(newText);

        // Set cursor position after the emoji
        setTimeout(() => {
          const newCursorPosition = validStart + emoji.length;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          textarea.focus();
        }, 0);
      } else {
        // Fallback: append emoji to the end
        onMessageTextChange(messageText + emoji);
      }

      setShowEmojiPicker(false);
    },
    [messageText, onMessageTextChange],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSendMessage();
      }
    },
    [onSendMessage],
  );

  return (
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
            onChange={(e) => onMessageTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
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
            onClick={onSendMessage}
            disabled={!messageText.trim() || isSending}
            aria-label="Send message"
            className="mr-2 h-8 px-3 text-sm font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
