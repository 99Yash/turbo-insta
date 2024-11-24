ALTER TABLE "turbo-insta_post" RENAME TO "posts";--> statement-breakpoint
ALTER TABLE "posts" RENAME COLUMN "name" TO "title";--> statement-breakpoint
DROP INDEX IF EXISTS "name_idx";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updated_at" SET DEFAULT current_timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "title_idx" ON "posts" ("title");