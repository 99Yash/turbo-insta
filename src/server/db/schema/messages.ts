import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "~/lib/utils";
import { users } from "./users";
import { lifecycleDates } from "./utils";

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "file",
  "system",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    // Channel name using the createPrivateChannelName utility
    channelName: varchar("channel_name", { length: 255 }).notNull().unique(),
    // Store participant IDs for easy querying
    participant1Id: varchar("participant_1_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    participant2Id: varchar("participant_2_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Last message info for conversation list
    lastMessageId: varchar("last_message_id"),
    lastMessageAt: text("last_message_at"),
    // Unread counts for each participant
    unreadCountParticipant1: text("unread_count_participant_1")
      .default("0")
      .notNull(),
    unreadCountParticipant2: text("unread_count_participant_2")
      .default("0")
      .notNull(),
    ...lifecycleDates,
  },
  (conversation) => ({
    channelNameIndex: index("conversation_channel_name_idx").on(
      conversation.channelName,
    ),
    participant1Index: index("conversation_participant_1_idx").on(
      conversation.participant1Id,
    ),
    participant2Index: index("conversation_participant_2_idx").on(
      conversation.participant2Id,
    ),
    lastMessageAtIndex: index("conversation_last_message_at_idx").on(
      conversation.lastMessageAt,
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
    attachments: text("attachments"), // JSON array of attachment URLs/metadata
    status: messageStatusEnum("status").default("sent").notNull(),
    isEdited: boolean("is_edited").default(false).notNull(),
    editedAt: text("edited_at"),
    // For message replies/threading (future enhancement)
    replyToId: varchar("reply_to_id"),
    // For message reactions (future enhancement)
    reactions: text("reactions"), // JSON object with reaction counts
    ...lifecycleDates,
  },
  (message) => ({
    conversationIndex: index("message_conversation_idx").on(
      message.conversationId,
    ),
    senderIndex: index("message_sender_idx").on(message.senderId),
    createdAtIndex: index("message_created_at_idx").on(message.createdAt),
    statusIndex: index("message_status_idx").on(message.status),
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

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageType = Message["type"];
export type MessageStatus = Message["status"];
