CREATE TABLE IF NOT EXISTS "likes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"post_id" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_id_like_idx" ON "likes" ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_like_idx" ON "likes" ("user_id");