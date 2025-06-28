"use client";

import type * as Ably from "ably";
import { useCallback, useEffect, useState } from "react";
import { useAblyContext } from "~/lib/providers/ably-provider";

type PostLikeUpdate = {
  readonly type: "post_like_toggled";
  readonly postId: string;
  readonly userId: string;
  readonly isLiked: boolean;
  readonly count: number;
  readonly timestamp: Date;
};

type UsePostLikesOptions = {
  readonly postId: string;
  readonly initialCount?: number;
  readonly initialIsLiked?: boolean;
  readonly onLikeUpdate?: (data: PostLikeUpdate) => void;
};

/**
 * Hook for managing real-time post like updates using Ably
 * Subscribes to like events for a specific post and provides optimistic updates
 */
export function usePostLikes({
  postId,
  initialCount = 0,
  initialIsLiked = false,
  onLikeUpdate,
}: UsePostLikesOptions) {
  const client = useAblyContext();
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  // Update state when initial values change (e.g., from server query)
  useEffect(() => {
    setLikeCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  // Optimistic update for immediate UI feedback
  const optimisticToggle = useCallback(() => {
    setIsLiked((prev) => {
      const newIsLiked = !prev;
      setLikeCount((prevCount) => (newIsLiked ? prevCount + 1 : prevCount - 1));
      return newIsLiked;
    });
  }, []);

  // Subscribe to real-time like updates
  useEffect(() => {
    if (!client || !postId) {
      return;
    }

    const channelName = `likes:post:${postId}`;
    const channel = client.channels.get(channelName);

    const messageHandler = (message: Ably.Message) => {
      const data = message.data as PostLikeUpdate;

      if (data?.type === "post_like_toggled" && data?.postId === postId) {
        console.log(`🔔 [usePostLikes] Received real-time like update:`, {
          postId: data.postId,
          userId: data.userId,
          isLiked: data.isLiked,
          count: data.count,
        });

        // Update state with authoritative server data
        setLikeCount(data.count);
        setIsLiked(data.isLiked);

        // Call optional callback
        onLikeUpdate?.(data);
      }
    };

    void channel.subscribe("like_update", messageHandler);

    console.log(`🔔 [usePostLikes] Subscribed to channel: ${channelName}`);

    return () => {
      void channel.unsubscribe("like_update", messageHandler);
      console.log(
        `🔕 [usePostLikes] Unsubscribed from channel: ${channelName}`,
      );
    };
  }, [client, postId, onLikeUpdate]);

  return {
    likeCount,
    isLiked,
    optimisticToggle,
  };
}
