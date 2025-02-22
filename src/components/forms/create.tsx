"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "@radix-ui/react-icons";
import { MapPinIcon, SettingsIcon, UsersIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useUpload } from "~/hooks/use-upload";
import { showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";
import { FileUploader } from "../file-uploader";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Modal } from "../ui/modal";
import { Textarea } from "../ui/textarea";

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(z.instanceof(File)).min(1).max(3),
});

type Inputs = z.infer<typeof createPostSchema>;

export function Create() {
  const [open, setOpen] = React.useState(false);

  const { uploadFiles, progresses } = useUpload("postImage");

  const createPostMutation = api.posts.create.useMutation({
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const form = useForm<Inputs>({
    resolver: zodResolver(createPostSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: Inputs) {
    const t = toast.loading("Uploading files...");

    const uploads = await uploadFiles(data.files);

    if (!uploads) return;
    toast.loading("Files uploaded, creating post!", {
      id: t,
    });

    await createPostMutation.mutateAsync({
      title: data.title,
      files: uploads.map((f) => ({
        name: f.name,
        id: f.id,
        url: f.url,
      })),
    });

    toast.success("Post created successfully", {
      id: t,
    });

    form.reset();
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 size-4" aria-hidden="true" />
        Create
      </Button>
      <Modal showModal={open} setShowModal={setOpen}>
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md space-y-8 bg-background p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create new post
              </h1>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Share
              </Button>
            </div>
          </div>
          <Form {...form}>
            <form
              className="w-full max-w-md space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploader
                        accept={{
                          "image/*": [],
                        }}
                        maxFiles={3}
                        progresses={progresses}
                        disabled={isSubmitting}
                        maxSize={1024 * 1024 * 10}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <Textarea
                      placeholder="Write a caption..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 border-t pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Add location handler */
                  }}
                >
                  <MapPinIcon className="mr-2 size-4" />
                  Add location
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Add collaborators handler */
                  }}
                >
                  <UsersIcon className="mr-2 size-4" />
                  Add collaborators
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Add accessibility handler */
                  }}
                >
                  <span className="mr-2">Aa</span>
                  Accessibility
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Add settings handler */
                  }}
                >
                  <SettingsIcon className="mr-2 size-4" />
                  Advanced settings
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Modal>
    </>
  );
}
