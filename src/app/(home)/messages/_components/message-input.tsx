"use client";

import { Heart, ImageIcon, Smile } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface MessageInputProps {
  readonly onSendMessage: (content: string) => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Message...",
}: MessageInputProps) {
  const [message, setMessage] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSendMessage = React.useCallback(() => {
    if (!message.trim() || disabled) return;

    onSendMessage(message.trim());
    setMessage("");

    // Focus back to input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [message, onSendMessage, disabled]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage();
    },
    [handleSendMessage],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      {/* Attachment buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </div>

      {/* Input */}
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="rounded-full border border-border/40 bg-muted/30 px-4 py-2 text-sm focus-visible:ring-1 focus-visible:ring-offset-0"
          autoComplete="off"
        />
      </div>

      {/* Send button or heart */}
      {message.trim() ? (
        <Button
          type="submit"
          size="sm"
          disabled={disabled}
          className="rounded-full px-4 text-sm font-medium"
        >
          Send
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Heart className="h-5 w-5" />
        </Button>
      )}
    </form>
  );
}
