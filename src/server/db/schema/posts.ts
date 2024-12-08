import { relations } from "drizzle-orm";
import { index, json, pgTable, varchar } from "drizzle-orm/pg-core";
import { generateId } from "~/app/lib/utils";
import { type StoredFile } from "~/types";
import { comments } from "./comments";
import { likes } from "./likes";
import { lifecycleDates } from "./utils";

export const posts = pgTable(
  "posts",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    title: varchar("title", { length: 256 }),
    images: json("images").$type<StoredFile[]>().notNull(),
    userId: varchar("user_id", { length: 32 }).notNull(), // clerk user id
    ...lifecycleDates,
  },
  (example) => ({
    titleIndex: index("title_idx").on(example.title),
  }),
);

export const postRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
  likes: many(likes),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
