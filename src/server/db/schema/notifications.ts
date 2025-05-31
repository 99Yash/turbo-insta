import { generateId } from "ai";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { commentReplies, comments } from "./comments";
import { commentLikes, likes } from "./likes";
import { posts } from "./posts";
import { follows, users } from "./users";
import { lifecycleDates } from "./utils";

export const notificationTypeEnum = pgEnum("notification_type", [
  "like",
  "comment",
  "reply",
  "follow",
  "comment_like",
  "mention",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    // The user who will receive the notification
    recipientId: varchar("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The user who triggered the notification
    actorId: varchar("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    // Optional references to related entities
    postId: varchar("post_id").references(() => posts.id, {
      onDelete: "cascade",
    }),
    commentId: varchar("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    replyId: varchar("reply_id").references(() => commentReplies.id, {
      onDelete: "cascade",
    }),
    likeId: varchar("like_id").references(() => likes.id, {
      onDelete: "cascade",
    }),
    commentLikeId: varchar("comment_like_id").references(
      () => commentLikes.id,
      {
        onDelete: "cascade",
      },
    ),
    followId: varchar("follow_id").references(() => follows.id, {
      onDelete: "cascade",
    }),
    // Optional message for custom notifications
    message: text("message"),
    ...lifecycleDates,
  },
  (notification) => ({
    recipientIndex: index("notification_recipient_idx").on(
      notification.recipientId,
    ),
    actorIndex: index("notification_actor_idx").on(notification.actorId),
    typeIndex: index("notification_type_idx").on(notification.type),
    isReadIndex: index("notification_read_idx").on(notification.isRead),
    createdAtIndex: index("notification_created_at_idx").on(
      notification.createdAt,
    ),
  }),
);

export const notificationRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "notification_recipient",
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: "notification_actor",
  }),
  post: one(posts, {
    fields: [notifications.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
  reply: one(commentReplies, {
    fields: [notifications.replyId],
    references: [commentReplies.id],
  }),
  like: one(likes, {
    fields: [notifications.likeId],
    references: [likes.id],
  }),
  commentLike: one(commentLikes, {
    fields: [notifications.commentLikeId],
    references: [commentLikes.id],
  }),
  follow: one(follows, {
    fields: [notifications.followId],
    references: [follows.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationType = Notification["type"];
