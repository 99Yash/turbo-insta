import { relations } from "drizzle-orm";
import { index, pgTable, varchar } from "drizzle-orm/pg-core";
import { generateId } from "~/app/lib/utils";
import { posts } from "./posts";
import { lifecycleDates } from "./utils";

export const likes = pgTable(
  "likes",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    userId: varchar("user_id", { length: 32 }).notNull(), // clerk user id
    postId: varchar("post_id", { length: 32 }).notNull(),
    ...lifecycleDates,
  },
  (example) => ({
    postId: index("post_id_like_idx").on(example.postId),
    userId: index("user_id_like_idx").on(example.userId),
  }),
);

export const likeRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;
