import { ably } from "~/lib/ably";
import { generateId } from "~/lib/utils";
import type {
  CommentNotification,
  LikeNotification,
  NotificationMessage,
} from "~/types/notifications";

/**
 * Publishes a like notification to the post owner's notification channel
 */
export async function publishLikeNotification(
  notification: Omit<LikeNotification, "timestamp">,
): Promise<void> {
  // Validate postOwnerId before proceeding
  if (!notification.postOwnerId) {
    console.error("Cannot publish like notification: postOwnerId is missing");
    return;
  }

  const message: NotificationMessage = {
    id: generateId(),
    notification: {
      ...notification,
      timestamp: new Date().toISOString(),
    },
  };

  const channelName = `user-notifications:${notification.postOwnerId}`;
  console.log("Publishing like notification to channel:", channelName);

  try {
    const channel = ably.channels.get(channelName);
    await channel.publish("notification", message);
    console.log("Like notification published successfully");
  } catch (error) {
    console.error("Failed to publish like notification:", error);
    console.error("Channel name:", channelName);
    console.error("Message:", message);
    // Don't throw here as we don't want to break the like functionality
    // if notifications fail
  }
}

/**
 * Publishes a comment notification to the post owner's notification channel
 */
export async function publishCommentNotification(
  notification: Omit<CommentNotification, "timestamp">,
): Promise<void> {
  // Validate postOwnerId before proceeding
  if (!notification.postOwnerId) {
    console.error(
      "Cannot publish comment notification: postOwnerId is missing",
    );
    return;
  }

  const message: NotificationMessage = {
    id: generateId(),
    notification: {
      ...notification,
      timestamp: new Date().toISOString(),
    },
  };

  const channelName = `user-notifications:${notification.postOwnerId}`;
  console.log("Publishing comment notification to channel:", channelName);

  try {
    const channel = ably.channels.get(channelName);
    await channel.publish("notification", message);
    console.log("Comment notification published successfully");
  } catch (error) {
    console.error("Failed to publish comment notification:", error);
    console.error("Channel name:", channelName);
    console.error("Message:", message);
    // Don't throw here as we don't want to break the comment functionality
    // if notifications fail
  }
}
