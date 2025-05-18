import { relations } from "drizzle-orm";
import { index, pgTable, varchar } from "drizzle-orm/pg-core";
import { generateId } from "~/lib/utils";
import { posts } from "./posts";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const comments = pgTable(
  "comments",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
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
  (example) => ({
    postId: index("post_id_idx").on(example.postId),
  }),
);

export const commentRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
