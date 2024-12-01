import { relations, sql } from "drizzle-orm";
import { index, json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { generateId } from "~/app/lib/utils";
import { type StoredFile } from "~/types";
import { comments } from "./comments";

export const posts = pgTable(
  "posts",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    title: varchar("title", { length: 256 }),
    images: json("images").$type<StoredFile[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`current_timestamp`)
      .$onUpdate(() => new Date()),
    userId: varchar("user_id", { length: 32 }).notNull(), // clerk user id
  },
  (example) => ({
    titleIndex: index("title_idx").on(example.title),
  }),
);

export const postRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
