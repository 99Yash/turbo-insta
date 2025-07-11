import { relations } from "drizzle-orm";
import { index, pgTable, varchar } from "drizzle-orm/pg-core";
import { createId } from "~/lib/utils";
import { commentReplies, comments } from "./comments";
import { posts } from "./posts";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const likes = pgTable(
  "likes",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(), // clerk user id
    postId: varchar("post_id", { length: 32 })
      .references(() => posts.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (example) => [
    index("post_id_like_idx").on(example.postId),
    index("user_id_like_idx").on(example.userId),
  ],
);

export const likeRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const commentLikes = pgTable(
  "comment_likes",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    commentId: varchar("comment_id", { length: 32 })
      .references(() => comments.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (example) => [index("comment_id_like_idx").on(example.commentId)],
);

export const commentLikeRelations = relations(commentLikes, ({ one }) => ({
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
}));

export const commentReplyLikes = pgTable(
  "comment_reply_likes",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    commentReplyId: varchar("comment_reply_id", { length: 32 })
      .references(() => commentReplies.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (example) => [index("comment_reply_id_like_idx").on(example.commentReplyId)],
);

export const commentReplyLikeRelations = relations(
  commentReplyLikes,
  ({ one }) => ({
    user: one(users, {
      fields: [commentReplyLikes.userId],
      references: [users.id],
    }),
    commentReply: one(commentReplies, {
      fields: [commentReplyLikes.commentReplyId],
      references: [commentReplies.id],
    }),
  }),
);

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;
export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;
export type CommentReplyLike = typeof commentReplyLikes.$inferSelect;
export type NewCommentReplyLike = typeof commentReplyLikes.$inferInsert;
