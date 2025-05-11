"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Book2Small, GridLayoutRows, Tag } from "~/components/ui/icons/nucleo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getInitials } from "~/lib/utils";
import { type Post, type User } from "~/server/db/schema";
import { ProfilePosts } from "./profile-posts";

interface ProfileViewProps {
  user: User;
  posts: Post[];
  isCurrentUser: boolean;
}

export function ProfileView({ user, posts, isCurrentUser }: ProfileViewProps) {
  return (
    <div className="container py-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-8">
        <Avatar className="size-24 md:size-36 lg:size-40">
          <AvatarImage src={user.imageUrl ?? ""} alt={user.name} />
          <AvatarFallback className="text-2xl">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="mt-4 flex flex-1 flex-col md:mt-0">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-xl font-semibold">
              {user.username ?? user.name}
            </h1>

            {/* //TODO: Add stuff for current user */}
            {isCurrentUser ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit profile
                </Button>
                <Button variant="outline" size="sm">
                  View archive
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="default" size="sm">
                  Follow
                </Button>
                <Button variant="outline" size="sm">
                  Message
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-semibold">{posts.length}</span>
              <span className="text-sm text-muted-foreground">posts</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="font-semibold">0</span>
              <span className="text-sm text-muted-foreground">followers</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="font-semibold">0</span>
              <span className="text-sm text-muted-foreground">following</span>
            </div>
          </div>

          <div className="mt-4 flex max-md:justify-center">
            <p className="font-semibold">{user.name}</p>
            {user.bio && <p className="mt-1 text-sm">{user.bio}</p>}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="mt-8 flex w-full flex-col items-center border-t">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="flex h-auto w-full justify-center rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="posts"
              className="relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <GridLayoutRows className="size-4" />
              <span className="hidden md:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <Book2Small className="size-4" />
              <span className="hidden md:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <Tag className="size-4" />
              <span className="hidden md:inline">Tagged</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="posts"
            className="mt-6 flex w-full justify-center"
          >
            <div className="w-full">
              <ProfilePosts posts={posts} />
            </div>
          </TabsContent>

          <TabsContent
            value="saved"
            className="mt-6 flex w-full justify-center"
          >
            <div className="flex w-full flex-col items-center justify-center py-12">
              <Book2Small className="size-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No saved posts</h3>
              <p className="mt-2 text-center text-muted-foreground">
                When you save posts, they will appear here.
              </p>
            </div>
          </TabsContent>

          <TabsContent
            value="tagged"
            className="mt-6 flex w-full justify-center"
          >
            <div className="flex w-full flex-col items-center justify-center py-12">
              <Tag className="size-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No tagged posts</h3>
              <p className="mt-2 text-center text-muted-foreground">
                When people tag you in posts, they will appear here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
