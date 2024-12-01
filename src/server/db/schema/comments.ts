import { relations, sql } from "drizzle-orm";
import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { generateId } from "~/app/lib/utils";
import { posts } from "./posts";

export const comments = pgTable(
  "comments",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    text: varchar("text", { length: 256 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`current_timestamp`)
      .$onUpdate(() => new Date()),
    userId: varchar("user_id", { length: 32 }).notNull(), // clerk user id
    postId: varchar("post_id", { length: 32 }).notNull(),
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
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
