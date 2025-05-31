"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { Book2Small, GridLayoutRows, Tag } from "~/components/ui/icons/nucleo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getInitials } from "~/lib/utils";

import { type Post, type User } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { ProfileEditForm } from "../forms/edit-profile";
import { ProfilePosts } from "./profile-posts";
import { SavedPosts } from "./saved-posts";
import { TaggedPosts } from "./tagged-posts";

interface ProfileViewProps {
  user: User;
  posts: (Post & {
    likeCount?: number;
    commentCount?: number;
  })[];
  isCurrentUser: boolean;
  defaultTab?: "posts" | "saved" | "tagged";
  postCount?: number;
}

export function ProfileView({
  user,
  posts,
  isCurrentUser,
  defaultTab = "posts",
  postCount,
}: ProfileViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const { user: currentUser } = useUser();
  const utils = api.useUtils();

  const { data: followers } = api.user.getFollowers.useQuery({
    userId: user.id,
  });
  const { data: following } = api.user.getFollowing.useQuery({
    userId: user.id,
  });

  // Check if current user is following this profile user
  const { data: isFollowingUser, isLoading: isFollowingLoading } =
    api.user.isFollowing.useQuery(
      { targetUserId: user.id },
      {
        enabled: !isCurrentUser && !!currentUser?.id,
        refetchOnWindowFocus: false,
      },
    );

  const toggleFollowMutation = api.user.toggleFollow.useMutation({
    onSuccess: async (_data) => {
      await Promise.all([
        utils.user.getFollowers.invalidate({ userId: user.id }),
        utils.user.getFollowing.invalidate({ userId: user.id }),
        utils.user.isFollowing.invalidate({ targetUserId: user.id }),
      ]);
    },
    onError: (error) => {
      console.error("Failed to toggle follow:", error.message);
    },
  });

  const handleFollowToggle = () => {
    if (!currentUser?.id || isCurrentUser) return;

    toggleFollowMutation.mutate({ targetUserId: user.id });
  };

  const getFollowButtonText = () => {
    if (toggleFollowMutation.isPending) {
      return isFollowingUser ? "Unfollowing..." : "Following...";
    }
    return isFollowingUser ? "Unfollow" : "Follow";
  };

  const getFollowButtonVariant = () => {
    return isFollowingUser ? "outline" : "default";
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="flex animate-fade-in flex-col animation-delay-200 md:flex-row md:items-center md:gap-8">
        <div className="flex justify-center md:justify-start">
          <Avatar className="size-24 shadow-md ring-2 ring-primary/10 md:size-32">
            <AvatarImage src={user.imageUrl ?? ""} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-6 flex flex-1 flex-col animation-delay-200 md:mt-0">
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
                  variant={getFollowButtonVariant()}
                  size="sm"
                  className="px-4 font-medium"
                  onClick={handleFollowToggle}
                  disabled={
                    toggleFollowMutation.isPending || isFollowingLoading
                  }
                >
                  {getFollowButtonText()}
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
              <span className="text-lg font-bold">
                {postCount ?? posts.length}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {(postCount ?? posts.length) === 1 ? "post" : "posts"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">
                {followers?.length ?? 0}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {followers?.length === 1 ? "follower" : "followers"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">
                {following?.length ?? 0}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {following?.length === 1 ? "following" : "following"}
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
      <div className="mt-8 w-full animate-fade-in border-t animation-delay-300">
        <Tabs value={defaultTab} className="w-full">
          <TabsList className="flex h-auto w-full justify-center rounded-none border-b bg-transparent p-0">
            <Link href={`/${user.username}`} className="flex-1">
              <TabsTrigger
                value="posts"
                className="relative w-full rounded-none px-4 py-3 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
              >
                <GridLayoutRows className="mr-2 size-4" />
                <span className="text-sm font-medium">Posts</span>
              </TabsTrigger>
            </Link>
            {currentUser?.id === user.id && (
              <Link href={`/${user.username}/saved`} className="flex-1">
                <TabsTrigger
                  value="saved"
                  className="relative w-full rounded-none px-4 py-3 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
                >
                  <Book2Small className="mr-2 size-4" />
                  <span className="text-sm font-medium">Saved</span>
                </TabsTrigger>
              </Link>
            )}
            <Link href={`/${user.username}/tagged`} className="flex-1">
              <TabsTrigger
                value="tagged"
                className="relative w-full rounded-none px-4 py-3 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
              >
                <Tag className="mr-2 size-4" />
                <span className="text-sm font-medium">Tagged</span>
              </TabsTrigger>
            </Link>
          </TabsList>

          <TabsContent
            value="posts"
            className="mt-6 animate-slide-up animation-delay-400"
          >
            <ProfilePosts posts={posts} />
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {isCurrentUser ? (
              <SavedPosts />
            ) : (
              <div className="flex w-full flex-col items-center justify-center py-16">
                <Book2Small className="size-16 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Private</h3>
                <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                  Only {user.username} can see their saved posts.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tagged" className="mt-6">
            <TaggedPosts username={user.username ?? user.name} />
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
