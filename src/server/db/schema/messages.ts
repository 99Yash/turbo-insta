import { relations } from "drizzle-orm";
import {
  index,
  json,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "~/lib/utils";
import { type StoredFile } from "~/types";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "file",
  "system",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    // Store participant IDs for easy querying
    participant1Id: varchar("participant_1_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    participant2Id: varchar("participant_2_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...lifecycleDates,
  },
  (conversation) => ({
    participant1Index: index("conversation_participant_1_idx").on(
      conversation.participant1Id,
    ),
    participant2Index: index("conversation_participant_2_idx").on(
      conversation.participant2Id,
    ),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    conversationId: varchar("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: messageTypeEnum("type").default("text").notNull(),
    content: text("content"), // Text content
    attachments: json("attachments").$type<StoredFile[]>(), // File attachments
    ...lifecycleDates,
  },
  (message) => ({
    conversationIndex: index("message_conversation_idx").on(
      message.conversationId,
    ),
    senderIndex: index("message_sender_idx").on(message.senderId),
    createdAtIndex: index("message_created_at_idx").on(message.createdAt),
  }),
);

// Add read receipts table for proper unread tracking
export const messageReads = pgTable(
  "message_reads",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    messageId: varchar("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: text("read_at").notNull(),
    ...lifecycleDates,
  },
  (messageRead) => ({
    messageIndex: index("message_read_message_idx").on(messageRead.messageId),
    userIndex: index("message_read_user_idx").on(messageRead.userId),
    messageUserIndex: index("message_read_message_user_idx").on(
      messageRead.messageId,
      messageRead.userId,
    ),
  }),
);

export const conversationRelations = relations(
  conversations,
  ({ one, many }) => ({
    participant1: one(users, {
      fields: [conversations.participant1Id],
      references: [users.id],
      relationName: "conversation_participant_1",
    }),
    participant2: one(users, {
      fields: [conversations.participant2Id],
      references: [users.id],
      relationName: "conversation_participant_2",
    }),
    messages: many(messages),
  }),
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
  reads: many(messageReads),
}));

export const messageReadRelations = relations(messageReads, ({ one }) => ({
  message: one(messages, {
    fields: [messageReads.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReads.userId],
    references: [users.id],
  }),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageRead = typeof messageReads.$inferSelect;
export type NewMessageRead = typeof messageReads.$inferInsert;
export type MessageType = Message["type"];
