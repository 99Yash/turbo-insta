"use client";

import { BookmarkIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { GridLayoutRows } from "~/components/ui/icons/nucleo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getInitials } from "~/lib/utils";
import { type Post, type User } from "~/server/db/schema";
import { ProfilePosts } from "./profile-posts";

interface ProfileViewProps {
  user: User;
  posts: Post[];
}

export function ProfileView({ user, posts }: ProfileViewProps) {
  const isCurrentUser = user.id === posts[0]?.userId;

  return (
    <div className="container mx-auto max-w-4xl py-8">
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

          <div className="mt-4 flex space-x-6">
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

          <div className="mt-4">
            <p className="font-semibold">{user.name}</p>
            {user.bio && <p className="mt-1 text-sm">{user.bio}</p>}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="mt-8 border-t">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="flex justify-center">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 px-4 py-3"
            >
              <GridLayoutRows className="size-4" />
              <span className="hidden md:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="flex items-center gap-2 px-4 py-3"
            >
              <BookmarkIcon className="size-4" />
              <span className="hidden md:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="flex items-center gap-2 px-4 py-3"
            >
              <ExclamationTriangleIcon className="size-4" />
              <span className="hidden md:inline">Tagged</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <ProfilePosts posts={posts} />
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <BookmarkIcon className="size-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No saved posts</h3>
              <p className="mt-2 text-center text-muted-foreground">
                When you save posts, they will appear here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tagged" className="mt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <ExclamationTriangleIcon className="size-12 text-muted-foreground" />
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
