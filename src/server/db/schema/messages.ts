import { relations } from "drizzle-orm";
import {
  index,
  json,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { createId } from "~/lib/utils";
import { type StoredFile } from "~/types";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const messages = pgTable(
  "messages",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    text: text("text").notNull(),
    files: json("files").$type<StoredFile[]>(),
    conversationId: varchar("conversation_id", { length: 32 })
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    senderId: varchar("sender_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    receiverId: varchar("receiver_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversationId),
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
      .$defaultFn(() => createId())
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
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
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

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    // always store participants in consistent order for easier querying
    participant1Id: varchar("participant1_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    participant2Id: varchar("participant2_id", { length: 32 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    // when each participant deleted the conversation from their view (null = not deleted)
    participant1DeletedAt: timestamp("participant1_deleted_at"),
    participant2DeletedAt: timestamp("participant2_deleted_at"),
    // for future features like read receipts
    participant1LastSeenAt: timestamp("participant1_last_seen_at"),
    participant2LastSeenAt: timestamp("participant2_last_seen_at"),
    ...lifecycleDates,
  },
  (table) => [
    index("conversations_participant1_idx").on(table.participant1Id),
    index("conversations_participant2_idx").on(table.participant2Id),
    // for efficient lookups of conversations involving a user
    index("conversations_participants_idx").on(
      table.participant1Id,
      table.participant2Id,
    ),
    // ensure unique conversation between two users
    unique("conversations_participants_unique").on(
      table.participant1Id,
      table.participant2Id,
    ),
  ],
);

export const conversationRelations = relations(
  conversations,
  ({ one, many }) => ({
    participant1: one(users, {
      fields: [conversations.participant1Id],
      references: [users.id],
    }),
    participant2: one(users, {
      fields: [conversations.participant2Id],
      references: [users.id],
    }),
    messages: many(messages),
  }),
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = typeof messageReactions.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
