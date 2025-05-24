import { ably } from "~/lib/ably";
import { generateId } from "~/lib/utils";
import type {
  CommentNotification,
  LikeNotification,
  Notification,
  NotificationMessage,
} from "~/types/notifications";

/**
 * Publishes a like notification to the post owner's notification channel
 */
export async function publishNotification(
  notification: Omit<LikeNotification, "timestamp">,
): Promise<void>;

/**
 * Publishes a comment notification to the post owner's notification channel
 */
export async function publishNotification(
  notification: Omit<CommentNotification, "timestamp">,
): Promise<void>;

/**
 * Publishes a notification to the post owner's notification channel (generic implementation)
 * @param notification - The notification data without timestamp (will be added automatically)
 */
export async function publishNotification<T extends Notification>(
  notification: Omit<T, "timestamp">,
): Promise<void>;

export async function publishNotification<T extends Notification>(
  notification: Omit<T, "timestamp">,
): Promise<void> {
  // Validate postOwnerId before proceeding
  if (!notification.postOwnerId) {
    console.error(
      `Cannot publish ${notification.type} notification: postOwnerId is missing`,
    );
    return;
  }

  const message: NotificationMessage = {
    id: generateId(),
    notification: {
      ...notification,
      timestamp: new Date().toISOString(),
    } as T,
  };

  const channelName = `user-notifications:${notification.postOwnerId}`;
  console.log(
    `Publishing ${notification.type} notification to channel:`,
    channelName,
  );

  try {
    const channel = ably.channels.get(channelName);
    await channel.publish("notification", message);
    console.log(`${notification.type} notification published successfully`);
  } catch (error) {
    console.error(
      `Failed to publish ${notification.type} notification:`,
      error,
    );
    console.error("Channel name:", channelName);
    console.error("Message:", message);
    // Don't throw here as we don't want to break the functionality
    // if notifications fail
  }
}

/**
 * @deprecated Use publishNotification instead
 * Publishes a like notification to the post owner's notification channel
 */
export async function publishLikeNotification(
  notification: Omit<LikeNotification, "timestamp">,
): Promise<void> {
  return publishNotification(notification);
}

/**
 * @deprecated Use publishNotification instead
 * Publishes a comment notification to the post owner's notification channel
 */
export async function publishCommentNotification(
  notification: Omit<CommentNotification, "timestamp">,
): Promise<void> {
  return publishNotification(notification);
}
