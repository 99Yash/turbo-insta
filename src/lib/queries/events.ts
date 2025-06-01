import { EventEmitter, on } from "events";
import type { Notification, NotificationType } from "~/server/db/schema";

export interface NotificationEvent {
  readonly id: string;
  readonly type: NotificationType;
  readonly recipientId: string;
  readonly actorId: string;
  readonly data: Notification;
}

/**
 * Global event emitter for real-time notifications
 * This allows us to emit events from anywhere in the application
 * and listen to them in our tRPC subscriptions
 */
class NotificationEventEmitter extends EventEmitter {
  /**
   * Emit a new notification event
   */
  emitNotification(event: NotificationEvent): void {
    this.emit("notification", event);
  }

  /**
   * Listen for notification events using Node.js 'on' utility
   * This returns an async iterable suitable for tRPC subscriptions
   */
  async *onNotificationStream(options?: { signal?: AbortSignal }) {
    for await (const [event] of on(this, "notification", {
      signal: options?.signal,
    })) {
      yield event as NotificationEvent;
    }
  }
}

// Global singleton instance
export const notificationEvents = new NotificationEventEmitter();

// Increase max listeners to prevent memory leak warnings
notificationEvents.setMaxListeners(100);
