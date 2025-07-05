-- Up migration: add read_at column, backfill, drop old boolean

-- 1. Add the new read_at column (timestamp) - allows NULLs for unread notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" timestamp;

-- 2. Backfill: set read_at to updated_at for notifications that were previously marked as read
UPDATE "notifications"
SET "read_at" = "updated_at"
WHERE "is_read" = TRUE
  AND "read_at" IS NULL;

-- 3. Drop the old boolean column
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "is_read";

-- 4. Drop the old index on the boolean column (if it exists)
DROP INDEX IF EXISTS "notification_read_idx";

-- 5. Re-create the index on the new column for faster unread filtering (NULL = unread)
CREATE INDEX IF NOT EXISTS "notification_read_idx" ON "notifications" ("read_at");

-- Down migration: revert back to is_read boolean (simplistic)

-- 1. Recreate is_read column (default false)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_read" boolean DEFAULT FALSE NOT NULL;

-- 2. Backfill: mark rows as read where read_at is not null
UPDATE "notifications"
SET "is_read" = TRUE
WHERE "read_at" IS NOT NULL;

-- 3. Remove read_at column
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read_at";

-- 4. Recreate original index on is_read
CREATE INDEX IF NOT EXISTS "notification_read_idx" ON "notifications" ("is_read"); 