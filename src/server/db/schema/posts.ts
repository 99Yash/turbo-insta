import { generateId } from "ai";
import { relations } from "drizzle-orm";
import { index, json, pgTable, varchar } from "drizzle-orm/pg-core";
import { type StoredFile } from "~/types";
import { comments } from "./comments";
import { likes } from "./likes";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const posts = pgTable(
  "posts",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    title: varchar("title", { length: 256 }),
    images: json("images").$type<StoredFile[]>().notNull(),
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(), // clerk user id
    ...lifecycleDates,
  },
  (example) => ({
    titleIndex: index("title_idx").on(example.title),
    userIdIndex: index("user_id_idx").on(example.userId),
  }),
);

export const postRelations = relations(posts, ({ many, one }) => ({
  comments: many(comments),
  likes: many(likes),
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    postId: varchar("post_id", { length: 32 })
      .references(() => posts.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (example) => ({
    userIdIndex: index("bookmark_user_id_idx").on(example.userId),
    postIdIndex: index("bookmark_post_id_idx").on(example.postId),
  }),
);

export const postBookmarks = relations(bookmarks, ({ one }) => ({
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
