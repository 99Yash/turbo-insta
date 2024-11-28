ALTER TABLE "images" ADD COLUMN "updated_at" timestamp DEFAULT current_timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_id_idx" ON "images" ("post_id");