"use client";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FileUploader } from "~/components/file-uploader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Loading } from "~/components/ui/icons";
import { CircleInfo, Sparkle3 } from "~/components/ui/icons/nucleo";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import { StarBorder } from "~/components/utils/star-border";
import { useUpload } from "~/hooks/use-upload";
import { showErrorToast } from "~/lib/utils";
import type { Post } from "~/server/db/schema";
import { api } from "~/trpc/react";
import type { StoredFile } from "~/types";

// Extended File type for stored files
interface StoredFileProxy extends File {
  _isStoredFile: true;
  _storedFile: StoredFile;
}

// Type guard to check if file is a stored file proxy
function isStoredFileProxy(file: File): file is StoredFileProxy {
  return (
    "_isStoredFile" in file && (file as StoredFileProxy)._isStoredFile === true
  );
}

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(z.instanceof(File)).min(1).max(3),
  altTexts: z.array(z.string().optional()).optional(),
});

// Schema for editing - files are already StoredFile objects
export const editPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(z.custom<StoredFile>()).min(1).max(3),
  altTexts: z.array(z.string().optional()).optional(),
});

// Union type for both schemas
export const postFormSchema = z.union([createPostSchema, editPostSchema]);

type Inputs = z.infer<typeof createPostSchema>;

interface CreateProps {
  post?: Post;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export function Create({
  post,
  open: externalOpen,
  setOpen: externalSetOpen,
}: CreateProps) {
  const { user } = useUser();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [step, setStep] = React.useState<"upload" | "details">("upload");
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen;
  const setOpen = externalSetOpen ?? setInternalOpen;

  const { uploadFiles, progresses } = useUpload("postImage");
  const utils = api.useUtils();

  const createPostMutation = api.posts.create.useMutation({
    onSuccess: async () => {
      await utils.posts.getAll.invalidate();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const editPostMutation = api.posts.edit.useMutation({
    onSuccess: async () => {
      await utils.posts.getAll.invalidate();
      await utils.posts.getByUserId.invalidate();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const isEditMode = !!post;

  const form = useForm<Inputs>({
    resolver: zodResolver(createPostSchema),
    defaultValues: isEditMode
      ? {
          title: post.title ?? "",
          files: [], // We'll handle this differently for edit mode
          altTexts: post.images?.map((img) => img.alt) ?? [],
        }
      : undefined,
  });

  React.useEffect(() => {
    if (isEditMode && post && open) {
      // In edit mode, skip the upload step and go directly to details
      setStep("details");
      // For edit mode, we need to create fake File objects from StoredFiles for form compatibility
      const createFakeFileFromStoredFile = (
        storedFile: StoredFile,
      ): StoredFileProxy => {
        const fakeFile = new File([], storedFile.name, {
          type: "image/jpeg",
        }) as StoredFileProxy;
        // Add properties to identify this as a stored file
        fakeFile._isStoredFile = true;
        fakeFile._storedFile = storedFile;
        return fakeFile;
      };

      const fakeFiles = post.images?.map(createFakeFileFromStoredFile) ?? [];
      form.setValue("files", fakeFiles);
      form.setValue("title", post.title ?? "");
      form.setValue("altTexts", post.images?.map((img) => img.alt) ?? []);
    }
  }, [isEditMode, post, open, form]);

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: Inputs) {
    if (isEditMode && post) {
      const t = toast.loading("Updating post...");

      try {
        await editPostMutation.mutateAsync({
          postId: post.id,
          title: data.title,
          altTexts: data.altTexts,
        });

        toast.success("Post updated successfully", {
          id: t,
        });

        form.reset();
        setOpen(false);
      } catch {
        toast.error("Failed to update post", {
          id: t,
        });
      }
      return;
    }

    // Original create logic
    const t = toast.loading("Uploading files...");

    const uploads = await uploadFiles(data.files);
    if (!uploads) return;

    toast.loading("Files uploaded, creating post...", {
      id: t,
    });

    await createPostMutation.mutateAsync({
      title: data.title,
      files: uploads.map((f, index) => ({
        name: f.name,
        id: f.id,
        url: f.url,
        alt: data.altTexts?.[index] ?? undefined,
      })),
    });

    toast.success("Post created successfully", {
      id: t,
    });

    form.reset();
    setOpen(false);
  }

  const handleNext = () => {
    if (form.getValues("files")?.length > 0) {
      setStep("details");
    } else {
      toast.error("Please upload at least one image");
    }
  };

  const handleBack = () => {
    if (isEditMode) {
      // In edit mode, going back should close the modal
      handleCloseModal();
    } else {
      setStep("upload");
    }
  };

  const handleCloseModal = () => {
    setOpen(false);
    setStep(isEditMode ? "details" : "upload");
    form.reset();
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", duration: 0.3 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const nextImage = () => {
    const files = form.getValues("files");
    if (files && currentImageIndex < files.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const getImageSrc = (file: File, _index: number): string => {
    // Check if this is a fake file created from StoredFile
    if (isStoredFileProxy(file)) {
      return file._storedFile.url;
    }
    return URL.createObjectURL(file);
  };

  return (
    <>
      {!isEditMode && (
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
          <StarBorder
            className="mb-9 w-full"
            onClick={() => setOpen(true)}
            color="#28c8ef"
          >
            <Sparkle3 className="size-4" aria-hidden="true" />
            Create
          </StarBorder>
        </motion.div>
      )}

      <Modal
        showModal={open}
        setShowModal={handleCloseModal}
        className="min-w-[769px] max-w-fit"
      >
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              className="flex w-full max-w-screen-lg flex-col rounded-xl bg-background"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex items-center justify-between border-b p-4">
                {step === "details" && !isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="p-0"
                  >
                    <ChevronLeftIcon className="size-4" />
                    Back
                  </Button>
                )}

                <h1 className="text-lg font-semibold">
                  {isEditMode
                    ? "Edit post"
                    : step === "upload"
                      ? "Create new post"
                      : "Edit post"}
                </h1>

                {step === "upload" && !isEditMode ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={!form.getValues("files")?.length}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="font-medium text-blue-500 hover:text-blue-600"
                  >
                    {isSubmitting ? (
                      <Loading className="mr-2 size-4" />
                    ) : isEditMode ? (
                      "Update"
                    ) : (
                      "Share"
                    )}
                  </Button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {step === "upload" && !isEditMode ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    <Form {...form}>
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
                    </Form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 p-6"
                  >
                    <div className="relative aspect-square w-1/2 overflow-hidden rounded-lg bg-muted">
                      {form.getValues("files")?.[currentImageIndex] && (
                        <Image
                          src={getImageSrc(
                            form.getValues("files")[currentImageIndex]!,
                            currentImageIndex,
                          )}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          width={500}
                          height={500}
                        />
                      )}

                      {form.getValues("files")?.length > 1 && (
                        <>
                          <button
                            onClick={previousImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white disabled:opacity-50"
                            disabled={currentImageIndex === 0}
                          >
                            <ChevronLeftIcon className="size-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white disabled:opacity-50"
                            disabled={
                              currentImageIndex ===
                              form.getValues("files")?.length - 1
                            }
                          >
                            <ChevronRightIcon className="size-4" />
                          </button>

                          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
                            {form
                              .getValues("files")
                              ?.map((_, index) => (
                                <button
                                  key={index}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    index === currentImageIndex
                                      ? "bg-white"
                                      : "bg-white/50"
                                  }`}
                                  onClick={() => setCurrentImageIndex(index)}
                                />
                              ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex w-1/2 flex-col">
                      <div className="mb-4 flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground" />
                        <span className="font-semibold">{user?.fullName}</span>
                      </div>

                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="flex-1 space-y-4"
                        >
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <Textarea
                                  {...field}
                                  placeholder="Write a caption..."
                                  className="h-32 resize-none"
                                  disabled={isSubmitting}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2 border-t pt-4">
                            <Accordion
                              type="single"
                              collapsible
                              defaultValue="accessibility"
                            >
                              <AccordionItem value="accessibility">
                                <AccordionTrigger className="flex gap-2">
                                  <CircleInfo className="size-4" />
                                  Accessibility
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                  <p className="text-sm text-muted-foreground">
                                    Alt text describes your photos for people
                                    with visual impairments. Alt text will be
                                    automatically created for your photos if you
                                    don&apos;t provide one.
                                  </p>

                                  {form
                                    .getValues("files")
                                    ?.map((file, index) => (
                                      <div key={index} className="flex gap-2">
                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                                          <Image
                                            src={getImageSrc(file, index)}
                                            alt={
                                              isStoredFileProxy(file)
                                                ? file._storedFile.name
                                                : file.name
                                            }
                                            width={48}
                                            height={48}
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                        <FormField
                                          control={form.control}
                                          name={`altTexts.${index}`}
                                          render={({ field }) => (
                                            <FormItem className="flex-1">
                                              <FormControl>
                                                <Input
                                                  {...field}
                                                  placeholder="Write alt text..."
                                                  className="flex-1"
                                                  disabled={isSubmitting}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    ))}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
}
