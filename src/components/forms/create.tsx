"use client";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useUpload } from "~/hooks/use-upload";
import { showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";
import { FileUploader } from "../file-uploader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Loading } from "../ui/icons";
import { Modal } from "../ui/modal";
import { Textarea } from "../ui/textarea";

export const createPostSchema = z.object({
  title: z.string().min(1).max(256),
  files: z.array(z.instanceof(File)).min(1).max(3),
  altTexts: z.array(z.string()).optional(),
});

type Inputs = z.infer<typeof createPostSchema>;

export function Create() {
  const { user } = useUser();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"upload" | "details">("upload");
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

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
    setStep("upload");
  };

  const handleCloseModal = () => {
    setOpen(false);
    setStep("upload");
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

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="mr-2 size-4" aria-hidden="true" />
          Create
        </Button>
      </motion.div>

      <Modal
        showModal={open}
        setShowModal={handleCloseModal}
        className="max-w-fit"
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
                  {step === "upload" ? "Create new post" : "Edit post"}
                </h1>

                {step === "upload" ? (
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
                          src={URL.createObjectURL(
                            form.getValues("files")[currentImageIndex]!,
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
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.imageUrl} />
                          <AvatarFallback>
                            <UserIcon className="size-4" />
                          </AvatarFallback>
                        </Avatar>
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

                          <Accordion
                            type="single"
                            collapsible
                            defaultValue="accessibility"
                          >
                            <AccordionItem value="accessibility">
                              <AccordionTrigger>Accessibility</AccordionTrigger>
                              <AccordionContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  Alt text describes your photos for people with
                                  visual impairments. Alt text will be
                                  automatically created for your photos if you
                                  don&apos;t provide one.
                                </p>

                                {form.getValues("files")?.map((file, index) => (
                                  <div key={index} className="flex gap-2">
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                                      <Image
                                        src={URL.createObjectURL(file)}
                                        alt=""
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
                                            <Textarea
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
