import {
  BookmarkIcon,
  ChatBubbleIcon,
  HeartIcon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { getCachedUser, users } from "~/lib/queries/user";
import { formatTimeToNow, getInitials } from "~/lib/utils";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const posts = await api.post.getAll();
  const user = await getCachedUser();

  return (
    <HydrateClient>
      <main className="flex flex-col items-center justify-center">
        {posts.map((post) => {
          const author = users.find((user) => user.id === post.userId);

          return (
            <div key={post.id} className="flex flex-col items-center gap-2">
              <Card className="max-w-[470px] border-0 shadow-none">
                <CardHeader className="flex flex-row items-center space-x-4 p-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={author?.imageUrl}
                      alt={author?.fullName ?? "VH"}
                    />
                    <AvatarFallback>
                      {getInitials(author?.fullName ?? "VH")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{author?.fullName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <Image
                      src={post.images[0]?.url ?? `/images/image.png`}
                      alt="Post image"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-none"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 p-4">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex space-x-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                      >
                        <HeartIcon className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                      >
                        <ChatBubbleIcon className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                      >
                        <PaperPlaneIcon className="h-6 w-6" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-9 w-9 rounded-full"
                    >
                      <BookmarkIcon className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-semibold">n likes</p>
                    <div className="mt-1 text-sm">
                      <span className="font-semibold">{author?.firstName}</span>{" "}
                      {post.title}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatTimeToNow(post.createdAt)}
                    </p>
                  </div>
                  {user?.imageUrl && (
                    <div className="flex w-full items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} alt="Your avatar" />
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <Input
                        className="flex-1 border-none bg-transparent text-sm"
                        placeholder="Add a comment..."
                      />
                      <Button
                        variant="ghost"
                        className="text-sm font-semibold text-blue-500"
                      >
                        Post
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>
          );
        })}
      </main>
    </HydrateClient>
  );
}
