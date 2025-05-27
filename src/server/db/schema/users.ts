import { generateId } from "ai";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
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

export const follows = pgTable(
  "follows",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    followerId: varchar("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: varchar("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...lifecycleDates,
  },
  (follow) => ({
    followerIndex: index("follower_idx").on(follow.followerId),
    followingIndex: index("following_idx").on(follow.followingId),
    uniqueFollowRelation: unique("unique_follow_relation").on(
      follow.followerId,
      follow.followingId,
    ),
  }),
);

export const userRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  commentReplies: many(commentReplies),
  commentLikes: many(commentLikes),
  bookmarks: many(bookmarks),
  following: many(follows, { relationName: "user_following" }),
  followers: many(follows, { relationName: "user_followers" }),
}));

export const followRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "user_followers",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "user_following",
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
