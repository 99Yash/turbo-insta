"use client";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross1Icon,
} from "@radix-ui/react-icons";
import { AnimatePresence, motion, type Variants } from "framer-motion";
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

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(z.instanceof(File)).min(0).max(3),
  altTexts: z.array(z.string().optional()).optional(),
});

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

  // State for managing existing images in edit mode
  const [existingImages, setExistingImages] = React.useState<StoredFile[]>([]);

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
    defaultValues: {
      title: "",
      files: [],
      altTexts: [],
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      if (isEditMode && post) {
        setStep("upload");
        form.setValue("title", post.title ?? "");
        form.setValue("files", []);
        // Set existing images
        setExistingImages(post.images ?? []);
        form.setValue(
          "altTexts",
          post.images?.map((img) => img.alt ?? "") ?? [],
        );
      } else {
        // New post mode
        setStep("upload");
        form.reset();
        setExistingImages([]);
      }
      setCurrentImageIndex(0);
    }
  }, [open, isEditMode, post, form]);

  const isSubmitting = form.formState.isSubmitting;

  // Get total images (existing + new)
  const getTotalImages = () => {
    const newFiles = form.getValues("files") ?? [];
    return [...existingImages, ...newFiles];
  };

  const getTotalImageCount = () => getTotalImages().length;

  // Remove existing image
  const removeExistingImage = (index: number) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExistingImages);

    // Update alt texts array to match
    const currentAltTexts = form.getValues("altTexts") ?? [];
    const newAltTexts = currentAltTexts.filter((_, i) => i !== index);
    form.setValue("altTexts", newAltTexts);

    // Adjust current image index if needed
    const totalCount =
      newExistingImages.length + (form.getValues("files")?.length ?? 0);
    if (currentImageIndex >= totalCount && totalCount > 0) {
      setCurrentImageIndex(totalCount - 1);
    } else if (totalCount === 0) {
      setCurrentImageIndex(0);
    }
  };

  async function onSubmit(data: Inputs) {
    const totalImageCount = getTotalImageCount();

    if (totalImageCount === 0) {
      toast.error("Please add at least one image");
      return;
    }

    if (totalImageCount > 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }

    const t = toast.loading(
      isEditMode ? "Updating post..." : "Uploading files...",
    );

    try {
      let allFiles: StoredFile[] = [...existingImages];

      // Upload new files if any
      if (data.files.length > 0) {
        const uploads = await uploadFiles(data.files);
        if (!uploads) {
          toast.error("Failed to upload files", { id: t });
          return;
        }

        const newStoredFiles = uploads.map((f, index) => ({
          name: f.name,
          id: f.id,
          url: f.url,
          alt: data.altTexts?.[existingImages.length + index] ?? undefined,
        }));

        allFiles = [...allFiles, ...newStoredFiles];
      }

      // Update alt texts for existing images
      allFiles = allFiles.map((file, index) => ({
        ...file,
        alt: data.altTexts?.[index] ?? file.alt,
      }));

      toast.loading(isEditMode ? "Updating post..." : "Creating post...", {
        id: t,
      });

      if (isEditMode && post) {
        await editPostMutation.mutateAsync({
          postId: post.id,
          title: data.title,
          files: allFiles,
        });
        toast.success("Post updated successfully", { id: t });
      } else {
        await createPostMutation.mutateAsync({
          title: data.title,
          files: allFiles,
        });
        toast.success("Post created successfully", { id: t });
      }

      form.reset();
      setExistingImages([]);
      setOpen(false);
    } catch {
      toast.error(
        isEditMode ? "Failed to update post" : "Failed to create post",
        { id: t },
      );
    }
  }

  const handleNext = () => {
    const totalCount = getTotalImageCount();
    if (totalCount > 0) {
      setStep("details");
    } else {
      toast.error("Please add at least one image");
    }
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("upload");
    } else {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setOpen(false);
    setStep("upload");
    form.reset();
    setExistingImages([]);
    setCurrentImageIndex(0);
  };

  const modalVariants: Variants = {
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
    const totalCount = getTotalImageCount();
    if (currentImageIndex < totalCount - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const getImageSrc = (image: StoredFile | File, _index: number): string => {
    if (image instanceof File) {
      return URL.createObjectURL(image);
    }
    return image.url;
  };

  const getCurrentImage = () => {
    const totalImages = getTotalImages();
    return totalImages[currentImageIndex];
  };

  const canRemoveMoreImages = () => {
    return getTotalImageCount() > 1;
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
                {step === "details" && (
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
                    ? step === "upload"
                      ? "Edit images"
                      : "Edit post"
                    : step === "upload"
                      ? "Create new post"
                      : "Add details"}
                </h1>

                {step === "upload" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={getTotalImageCount() === 0}
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
                {step === "upload" ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    {/* Show existing images in edit mode */}
                    {isEditMode && existingImages.length > 0 && (
                      <div className="mb-6">
                        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                          Current Images ({existingImages.length})
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {existingImages.map((image, index) => (
                            <div key={image.id} className="group relative">
                              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                                <Image
                                  src={image.url}
                                  alt={image.alt ?? image.name}
                                  width={150}
                                  height={150}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              {canRemoveMoreImages() && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -right-2 -top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={() => removeExistingImage(index)}
                                >
                                  <Cross1Icon className="h-3 w-3" />
                                </Button>
                              )}
                              <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                                maxFiles={Math.max(
                                  0,
                                  3 - existingImages.length,
                                )}
                                progresses={progresses}
                                disabled={
                                  isSubmitting || existingImages.length >= 3
                                }
                                maxSize={1024 * 1024 * 10}
                                onValueChange={field.onChange}
                              />
                            </FormControl>
                            {existingImages.length >= 3 && (
                              <p className="text-sm text-muted-foreground">
                                Maximum of 3 images allowed. Remove existing
                                images to add new ones.
                              </p>
                            )}
                            {getTotalImageCount() > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Total images: {getTotalImageCount()}/3
                              </p>
                            )}
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
                      {getCurrentImage() && (
                        <Image
                          src={getImageSrc(
                            getCurrentImage()!,
                            currentImageIndex,
                          )}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          width={500}
                          height={500}
                        />
                      )}

                      {getTotalImageCount() > 1 && (
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
                              currentImageIndex === getTotalImageCount() - 1
                            }
                          >
                            <ChevronRightIcon className="size-4" />
                          </button>

                          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
                            {getTotalImages().map((_, index) => (
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

                                  {getTotalImages().map((image, index) => (
                                    <div key={index} className="flex gap-2">
                                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                                        <Image
                                          src={getImageSrc(image, index)}
                                          alt={
                                            image instanceof File
                                              ? image.name
                                              : (image.alt ?? image.name)
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
