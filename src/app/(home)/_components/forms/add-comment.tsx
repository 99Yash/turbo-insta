"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  AutosizeTextarea,
  type AutosizeTextAreaRef,
} from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Loading } from "~/components/ui/icons";
import { cn, showErrorToast } from "~/lib/utils";
import { MAX_COMMENT_CHAR_LENGTH } from "~/server/api/schema/comments.schema";
import { api } from "~/trpc/react";

const formSchema = z.object({
  text: z.string().max(MAX_COMMENT_CHAR_LENGTH, {
    message: `Comment cannot exceed ${MAX_COMMENT_CHAR_LENGTH} characters`,
  }),
});

type Inputs = z.infer<typeof formSchema>;

interface ReplyState {
  readonly username: string;
  readonly commentId: string;
}

interface AddCommentProps {
  readonly postId: string;
  readonly replyState?: ReplyState | null;
  readonly onClearReply?: () => void;
}

export function AddComment({
  postId,
  replyState,
  onClearReply,
}: AddCommentProps) {
  const textareaRef = React.useRef<AutosizeTextAreaRef | null>(null);

  const form = useForm<Inputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const trpcUtils = api.useUtils();

  // Handle reply state changes
  React.useEffect(() => {
    if (replyState?.username && textareaRef.current) {
      const replyText = `@${replyState.username} `;
      form.setValue("text", replyText);
      textareaRef.current.textArea.focus();
      // Set cursor position at the end
      const length = replyText.length;
      textareaRef.current.textArea.setSelectionRange(length, length);
    }
  }, [replyState, form]);

  const addComment = api.comments.create.useMutation({
    onSuccess: () => {
      toast.success("Comment added successfully");
      form.reset();
      onClearReply?.();
      void trpcUtils.comments.getByPostId.invalidate({ postId });
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const addReply = api.comments.createReply.useMutation({
    onSuccess: () => {
      toast.success("Reply added successfully");
      form.reset();
      onClearReply?.();
      void trpcUtils.comments.getReplies.invalidate({
        commentId: replyState?.commentId,
      });
      void trpcUtils.comments.getReplyCountsForComments.invalidate();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const currentText = form.getValues("text") || "";

    // Clear reply state on Escape key
    if (event.key === "Escape" && replyState) {
      event.preventDefault();
      onClearReply?.();
      return;
    }

    // Prevent typing if max characters reached
    if (
      currentText.length >= MAX_COMMENT_CHAR_LENGTH &&
      event.key !== "Backspace" &&
      event.key !== "Delete" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight"
    ) {
      event.preventDefault();

      // Optional: Show a toast to inform user
      toast.error("Maximum character limit reached");
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      if (currentText) {
        void form.handleSubmit(onSubmit)();
      }
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const currentText = form.getValues("text") || "";
    const pastedText = event.clipboardData.getData("text");

    if (currentText.length + pastedText.length > MAX_COMMENT_CHAR_LENGTH) {
      event.preventDefault();

      // Truncate pasted text to fit within limit
      const allowedLength = MAX_COMMENT_CHAR_LENGTH - currentText.length;
      const truncatedText = pastedText.slice(0, allowedLength);

      // Manually set the value
      form.setValue("text", currentText + truncatedText, {
        shouldValidate: true,
      });

      toast.warning("Pasted text was truncated to fit character limit");
    }
  }

  async function onSubmit(data: Inputs) {
    if (replyState?.commentId) {
      // Creating a reply
      await addReply.mutateAsync({
        text: data.text,
        commentId: replyState.commentId,
      });
    } else {
      // Creating a comment
      await addComment.mutateAsync({
        text: data.text,
        postId,
      });
    }
  }

  const currentText = form.watch("text") || "";
  const characterCount = currentText.length;
  const isDisabled =
    !currentText ||
    addComment.isPending ||
    addReply.isPending ||
    !form.formState.isValid;

  return (
    <div className="relative flex flex-col gap-3">
      {replyState && (
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Replying to{" "}
            <span className="font-semibold">@{replyState.username}</span>
          </span>
          <button
            type="button"
            onClick={onClearReply}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}
      <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
        <Form {...form}>
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="relative">
                <FormControl>
                  <div className="grid">
                    <AutosizeTextarea
                      {...field}
                      ref={textareaRef}
                      className={cn(
                        "flex w-full flex-1 resize-none rounded-md border-none bg-transparent pl-0 text-sm shadow-sm placeholder:font-medium placeholder:text-muted-foreground focus:border-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                        characterCount >= MAX_COMMENT_CHAR_LENGTH &&
                          "text-destructive",
                      )}
                      id="add-comment"
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      aria-label="Add a comment..."
                      placeholder="Add a comment..."
                      minHeight={10}
                      maxHeight={100}
                      data-replicated-value={field.value || ""}
                    />
                    <div
                      className="invisible whitespace-pre-wrap p-2"
                      data-replicated-value={field.value || ""}
                    />
                  </div>
                </FormControl>

                {/* Character Count Display */}
                <div
                  className={cn(
                    "absolute bottom-1 right-1 text-xs text-muted-foreground transition-all duration-300",
                    characterCount > MAX_COMMENT_CHAR_LENGTH * 0.9 &&
                      "text-destructive",
                    characterCount === 0 && "opacity-0",
                  )}
                >
                  <span>
                    {characterCount}/{MAX_COMMENT_CHAR_LENGTH}
                  </span>
                </div>
              </FormItem>
            )}
          />
          <Button
            disabled={isDisabled}
            variant="ghost"
            size="icon"
            type="submit"
            className={cn(
              "absolute right-[3px] top-[-3.5px] z-20 size-7 text-sm font-semibold text-blue-500",
              isDisabled && "hidden",
            )}
          >
            {replyState?.commentId ? (
              addReply.isPending
            ) : addComment.isPending ? (
              <Loading className="mr-2 size-3.5" aria-hidden="true" />
            ) : (
              "Post"
            )}
          </Button>
        </Form>
      </form>
    </div>
  );
}
