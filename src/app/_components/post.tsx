"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-input";
import { Loading } from "~/components/ui/icons";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.getLatest.invalidate();
      setName("");
      toast.success("Post created successfully");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate text-sm font-medium">
          Your most recent post: {latestPost.name}
        </p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        className="mt-2 flex flex-col gap-2"
      >
        <FloatingLabelInput
          autoFocus
          type="text"
          label="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={createPost.isPending || !name}>
          {createPost.isPending ? <Loading /> : "Submit"}
        </Button>
      </form>
    </div>
  );
}
