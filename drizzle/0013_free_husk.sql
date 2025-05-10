CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"image_url" text,
	"bio" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "username_idx" ON "users" ("username");