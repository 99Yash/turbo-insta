"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn, showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";
import { AutosizeTextarea } from "../ui/autosize-textarea";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Loading } from "../ui/icons";

const formSchema = z.object({
  text: z.string().max(2000),
});

type Inputs = z.infer<typeof formSchema>;

export function AddComment({ postId }: { postId: string }) {
  const form = useForm<Inputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const addComment = api.comments.create.useMutation({
    onSuccess: () => {
      toast.success("Comment added successfully");
      form.reset();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      if (form.getValues().text) {
        void form.handleSubmit(onSubmit)();
      }
    }
  }

  async function onSubmit(data: Inputs) {
    await addComment.mutateAsync({
      text: data.text,
      postId,
    });
  }

  const isDisabled = !form.getValues().text || addComment.isPending;

  return (
    <div className="relative flex items-center space-x-3 space-y-0">
      <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
        <Form {...form}>
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid">
                    <AutosizeTextarea
                      {...field}
                      className="flex w-full flex-1 resize-none rounded-md border-none bg-transparent pl-0 text-sm shadow-sm placeholder:text-muted-foreground focus:border-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      onKeyDown={handleKeyDown}
                      aria-label="Add a comment..."
                      placeholder="Add a comment..."
                      minHeight={10}
                      maxHeight={70}
                      data-replicated-value={field.value || ""}
                    />
                    <div
                      className="grid-area-[1/1/2/2] invisible whitespace-pre-wrap p-2"
                      data-replicated-value={field.value || ""}
                    />
                  </div>
                </FormControl>
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
            {addComment.isPending ? (
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
