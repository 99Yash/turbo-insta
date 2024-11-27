import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { generateId } from "~/lib/utils";
import { posts } from "./posts";

export const images = pgTable(
  "images",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    name: varchar("name", { length: 256 }),
    url: varchar("url", { length: 256 }),
    alt: varchar("alt", { length: 256 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    postId: varchar("post_id", { length: 256 })
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
  },
  (example) => ({
    urlIndex: index("url_idx").on(example.url),
  }),
);

export const imageRelations = relations(images, ({ one, many }) => ({
  post: one(posts, {
    fields: [images.postId],
    references: [posts.id],
  }),
}));

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
