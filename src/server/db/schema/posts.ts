import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { generateId } from "~/app/lib/utils";

export const posts = pgTable(
  "posts",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    title: varchar("title", { length: 256 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`current_timestamp`)
      .$onUpdate(() => new Date()),
  },
  (example) => ({
    titleIndex: index("title_idx").on(example.title),
  }),
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
