import { generateId } from "ai";
import { relations } from "drizzle-orm";
import {
  index,
  json,
  pgTable,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { type StoredFile } from "~/types";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const messages = pgTable(
  "messages",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    text: text("text").notNull(),
    files: json("files").$type<StoredFile[]>(),
    senderId: varchar("sender_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    receiverId: varchar("receiver_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (table) => [
    index("messages_sender_id_idx").on(table.senderId),
    index("messages_receiver_id_idx").on(table.receiverId),
    index("messages_sender_receiver_idx").on(table.senderId, table.receiverId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

export const messageReactions = pgTable(
  "message_reactions",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    // user who reacted to the message
    userId: varchar("user_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    messageId: varchar("message_id", { length: 32 })
      .references(() => messages.id, { onDelete: "cascade" })
      .notNull(),
    emoji: varchar("emoji", { length: 15 }).notNull(),
    ...lifecycleDates,
  },
  (table) => [
    index("message_id_reaction_idx").on(table.messageId),
    index("user_id_reaction_idx").on(table.userId),
    // for efficient lookups of user reactions on specific messages
    index("user_message_reaction_idx").on(table.userId, table.messageId),
    // one reaction per user per message
    unique("user_message_reaction_unique").on(table.userId, table.messageId),
  ],
);

export const messageRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
  }),
  reactions: many(messageReactions),
}));

export const messageReactionRelations = relations(
  messageReactions,
  ({ one }) => ({
    user: one(users, {
      fields: [messageReactions.userId],
      references: [users.id],
    }),
    message: one(messages, {
      fields: [messageReactions.messageId],
      references: [messages.id],
    }),
  }),
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = typeof messageReactions.$inferInsert;
