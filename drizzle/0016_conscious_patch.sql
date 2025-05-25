CREATE TABLE IF NOT EXISTS "comment_reply_likes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"comment_reply_id" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_reply_likes" ADD CONSTRAINT "comment_reply_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_reply_likes" ADD CONSTRAINT "comment_reply_likes_comment_reply_id_comment_replies_id_fk" FOREIGN KEY ("comment_reply_id") REFERENCES "public"."comment_replies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_reply_id_like_idx" ON "comment_reply_likes" ("comment_reply_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_id_reply_idx" ON "comment_replies" ("comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_reply_idx" ON "comment_replies" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_id_like_idx" ON "comment_likes" ("comment_id");