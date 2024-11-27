CREATE TABLE IF NOT EXISTS "images" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"url" varchar(256),
	"alt" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"post_id" varchar(256) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "url_idx" ON "images" ("url");