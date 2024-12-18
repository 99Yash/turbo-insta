"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";
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
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  async function onSubmit(data: Inputs) {
    await addComment.mutateAsync({
      text: data.text,
      postId,
    });
  }

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
                  <textarea
                    {...field}
                    className="flex h-[18px] w-full flex-1 resize-none rounded-md bg-transparent text-sm shadow-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Add a comment..."
                    placeholder="Add a comment..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            disabled={!form.getValues().text || addComment.isPending}
            variant="ghost"
            size="icon"
            type="submit"
            className="absolute right-[3px] top-[-3.5px] z-20 size-7 text-sm font-semibold text-blue-500"
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
