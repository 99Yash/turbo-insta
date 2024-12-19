import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { AddComment } from "~/components/forms/add-comment";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ProductImageCarousel } from "~/components/utils/product-carousel";
import { users } from "~/lib/queries/user";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import { api, HydrateClient } from "~/trpc/server";
import { ActionButtons } from "./components/action-buttons";

export default async function Home() {
  const posts = await api.posts.getAll();

  return (
    <HydrateClient>
      <main className="mt-12 flex flex-col items-center justify-center">
        {posts.map((post) => {
          const author = users.find((user) => user.id === post.userId);

          return (
            <div key={post.id} className="flex flex-col items-center gap-2">
              <div className="border-0 shadow-none">
                <div className="flex flex-row items-center gap-1.5 px-1 py-3.5">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={author?.imageUrl}
                      alt={author?.fullName ?? "VH"}
                    />
                    <AvatarFallback>
                      {getInitials(author?.fullName ?? "VH")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 items-center gap-2">
                    <p className="text-sm font-semibold">{author?.fullName}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      • {formatTimeToNow(post.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                  >
                    <DotsHorizontalIcon aria-hidden className="size-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </div>
                <div className="w-[calc(100vw-2px)] max-w-[470px] rounded">
                  <ProductImageCarousel files={post.images} />
                </div>
                <div className="flex flex-col gap-3 py-3">
                  <ActionButtons post={post} />
                  <div className="text-sm">
                    <span className="font-semibold">{author?.firstName}</span>{" "}
                    {post.title}
                  </div>
                </div>

                <AddComment postId={post.id} />
              </div>
            </div>
          );
        })}
      </main>
    </HydrateClient>
  );
}
