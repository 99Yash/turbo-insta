import { relations } from "drizzle-orm";
import { index, pgTable, varchar } from "drizzle-orm/pg-core";
import { createId } from "~/lib/utils";
import { commentLikes } from "./likes";
import { posts } from "./posts";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const comments = pgTable(
  "comments",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    text: varchar("text", { length: 1024 }),
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(), // clerk user id
    postId: varchar("post_id", { length: 32 })
      .references(() => posts.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (example) => [index("post_id_idx").on(example.postId)],
);

export const commentRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  commentLikes: many(commentLikes),
  commentReplies: many(commentReplies),
}));

export const commentReplies = pgTable(
  "comment_replies",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    text: varchar("text", { length: 1024 }),
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    commentId: varchar("comment_id", { length: 32 })
      .references(() => comments.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (example) => [
    index("comment_id_reply_idx").on(example.commentId),
    index("user_id_reply_idx").on(example.userId),
  ],
);

export const commentReplyRelations = relations(commentReplies, ({ one }) => ({
  user: one(users, {
    fields: [commentReplies.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentReplies.commentId],
    references: [comments.id],
  }),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
