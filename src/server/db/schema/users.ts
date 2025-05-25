import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { commentReplies, comments } from "./comments";
import { commentLikes, likes } from "./likes";
import { bookmarks, posts } from "./posts";
import { lifecycleDates } from "./utils";

export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey(), // Clerk ID
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    imageUrl: text("image_url"),
    bio: text("bio"),
    isVerified: boolean("is_verified").default(false).notNull(),
    ...lifecycleDates,
  },
  (user) => ({
    emailIndex: index("email_idx").on(user.email),
    usernameIndex: index("username_idx").on(user.username),
  }),
);

export const userRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  commentReplies: many(commentReplies),
  commentLikes: many(commentLikes),
  bookmarks: many(bookmarks),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
