"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { Book2Small, GridLayoutRows, Tag } from "~/components/ui/icons/nucleo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getInitials } from "~/lib/utils";
import { type Post, type User } from "~/server/db/schema";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfilePosts } from "./profile-posts";

interface ProfileViewProps {
  user: User;
  posts: (Post & {
    likeCount?: number;
    commentCount?: number;
  })[];
  isCurrentUser: boolean;
}

export function ProfileView({ user, posts, isCurrentUser }: ProfileViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="animate-fade-in animation-delay-200 flex flex-col md:flex-row md:items-center md:gap-8">
        <div className="flex justify-center md:justify-start">
          <Avatar className="size-24 shadow-md ring-2 ring-primary/10 md:size-32">
            <AvatarImage src={user.imageUrl ?? ""} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="animation-delay-200 mt-6 flex flex-1 flex-col md:mt-0">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold">{user.username ?? user.name}</h1>

            {isCurrentUser ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium hover:bg-accent/80"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium hover:bg-accent/80"
                >
                  View archive
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary px-4 font-medium hover:bg-primary/90"
                >
                  Follow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium hover:bg-accent/80"
                >
                  Message
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex space-x-10">
            <div className="flex flex-col">
              <span className="text-lg font-bold">{posts.length}</span>
              <span className="text-xs font-medium text-muted-foreground">
                posts
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">0</span>
              <span className="text-xs font-medium text-muted-foreground">
                followers
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">0</span>
              <span className="text-xs font-medium text-muted-foreground">
                following
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-base font-semibold">{user.name}</p>
            {user.bio && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="animate-fade-in animation-delay-300 mt-8 w-full border-t">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="flex h-auto w-full justify-center rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="posts"
              className="relative flex-1 rounded-none px-4 py-3 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <GridLayoutRows className="mr-2 size-4" />
              <span className="text-sm font-medium">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="relative flex-1 rounded-none px-4 py-3 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <Book2Small className="mr-2 size-4" />
              <span className="text-sm font-medium">Saved</span>
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="relative flex-1 rounded-none px-4 py-3 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <Tag className="mr-2 size-4" />
              <span className="text-sm font-medium">Tagged</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="posts"
            className="animate-slide-up animation-delay-400 mt-6"
          >
            <ProfilePosts posts={posts} />
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="flex w-full flex-col items-center justify-center py-16">
              <Book2Small className="size-16 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No saved posts</h3>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                When you save posts, they will appear here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tagged" className="mt-6">
            <div className="flex w-full flex-col items-center justify-center py-16">
              <Tag className="size-16 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No tagged posts</h3>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                When people tag you in posts, they will appear here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      {isCurrentUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <ProfileEditForm
              user={user}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
