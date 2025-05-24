export interface LikeNotification {
  readonly type: "like";
  readonly postId: string;
  readonly postOwnerId: string;
  readonly likedByUserId: string;
  readonly likedByUsername: string;
  readonly likedByImageUrl?: string;
  readonly postTitle?: string;
  readonly timestamp: string;
  readonly action: "added" | "removed";
}

export interface CommentNotification {
  readonly type: "comment";
  readonly postId: string;
  readonly postOwnerId: string;
  readonly commentedByUserId: string;
  readonly commentedByUsername: string;
  readonly commentedByImageUrl?: string;
  readonly postTitle?: string;
  readonly commentText: string;
  readonly timestamp: string;
}

export type Notification = LikeNotification | CommentNotification;

export interface NotificationMessage {
  readonly notification: Notification;
  readonly id: string;
}
