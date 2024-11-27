"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, UploadIcon } from "@radix-ui/react-icons";
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
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Loading } from "../ui/icons";
import { Modal } from "../ui/modal";
import { Textarea } from "../ui/textarea";

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(z.instanceof(File)).min(1).max(3),
});

type Inputs = z.infer<typeof createPostSchema>;

export function Create() {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>();

  const { uploadFiles, progresses, isUploading, uploadedFiles } =
    useUpload("postImage");

  const createPostMutation = api.post.create.useMutation({});

  const form = useForm<Inputs>({
    resolver: zodResolver(createPostSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: Inputs) {
    try {
      const t = toast.loading("Uploading files...");

      await uploadFiles(data.files);
      toast.loading("Files uploaded, creating post!", {
        id: t,
      });

      await createPostMutation.mutateAsync({
        title: data.title,
        files: data.files.map((file) => file.name),
      });

      toast.success("Post created successfully!", {
        id: t,
      });
      setOpen(false);
      form.reset()
    } catch (error) {
      showErrorToast(error);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 size-4" aria-hidden="true" />
        Create
      </Button>
      <Modal showModal={open} setShowModal={setOpen}>
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md space-y-8 bg-background p-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create a new post
            </h1>
          </div>
          <Form {...form}>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Title</FormLabel>
                    <Textarea
                      {...field}
                      value={field.value}
                      disabled={isSubmitting}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mr-4">Images/Files</FormLabel>
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
              <Button
                disabled={isSubmitting}
                className="mt-4 w-full bg-muted-foreground"
                type="submit"
              >
                {isSubmitting ? (
                  <Loading className="mr-2 size-4" aria-hidden="true" />
                ) : (
                  <>
                    <UploadIcon className="mr-2 size-4" aria-hidden="true" />
                    Upload
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </Modal>
    </>
  );
}
