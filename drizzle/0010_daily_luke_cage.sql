CREATE TABLE IF NOT EXISTS "comments" (
	"id" varchar PRIMARY KEY NOT NULL,
	"text" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp,
	"user_id" varchar(32) NOT NULL,
	"post_id" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_id_idx" ON "comments" ("post_id");