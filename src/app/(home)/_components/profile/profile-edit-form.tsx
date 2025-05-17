"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { FileUploader } from "~/components/file-uploader";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { useUploadThing } from "~/lib/uploadthing";
import { cn, showErrorToast } from "~/lib/utils";
import { type User } from "~/server/db/schema";
import { api } from "~/trpc/react";

// Define the validation schema for the profile form
export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username cannot exceed 30 characters" })
    .regex(/^[a-z0-9_\.]+$/, {
      message:
        "Username can only contain lowercase letters, numbers, periods, and underscores",
    }),
  bio: z
    .string()
    .max(160, { message: "Bio cannot exceed 160 characters" })
    .optional(),
  profileImage: z.instanceof(File).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({
  user,
  onSuccess,
  onCancel,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const { startUpload, isUploading } = useUploadThing("profileImage");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      bio: user.bio ?? "",
    },
    mode: "onChange",
  });

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Profile updated successfully");

      if (variables.username !== user.username) {
        router.replace(`/${variables.username}`);
      } else {
        router.refresh();
      }

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      showErrorToast(error);
      setIsPending(false);
    },
  });

  React.useEffect(() => {
    const bioValue = form.watch("bio");
    if (bioValue && bioValue.length > 160) {
      form.setError("bio", {
        type: "manual",
        message: "Bio cannot exceed 160 characters",
      });
    } else {
      form.clearErrors("bio");
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsPending(true);

      let imageUrl = user.imageUrl;

      // Upload profile image if provided
      if (data.profileImage) {
        const uploadResult = await startUpload([data.profileImage]);
        if (uploadResult?.[0]?.url) {
          imageUrl = uploadResult[0].url;
        }
      }

      // Submit the updated profile data
      await updateProfileMutation.mutateAsync({
        name: data.name,
        username: data.username,
        bio: data.bio ?? null,
        imageUrl,
      });
    } catch (error: unknown) {
      showErrorToast(error);
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Edit Profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your profile information visible to other users
          </p>
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="profileImage"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Profile Picture</FormLabel>
              <FormControl>
                <FileUploader
                  value={field.value ? [field.value] : []}
                  onValueChange={(files) => {
                    field.onChange(Array.isArray(files) ? files[0] : null);
                  }}
                  accept={{
                    "image/*": [".png", ".jpeg", ".jpg"],
                  }}
                  maxFiles={1}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-full bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Upload</p>
                  </div>
                </FileUploader>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormDescription>
                  Your full name visible to others
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                <FormDescription>
                  Your unique username for your profile URL
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself"
                  className="min-h-24 resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex justify-between">
                <span>A brief description about yourself</span>
                <span
                  className={cn(
                    "text-xs transition-colors",
                    field.value && field.value.length > 140
                      ? "text-amber-500"
                      : "text-muted-foreground",
                  )}
                >
                  {field.value?.length ?? 0}/160
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending || isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || isUploading || !form.formState.isDirty}
            className="gap-1"
          >
            {(isPending || isUploading) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
