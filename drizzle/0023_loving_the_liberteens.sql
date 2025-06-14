ALTER TYPE "notification_type" ADD VALUE 'reply_like';--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "unique_user_comment_like" UNIQUE("user_id","comment_id");--> statement-breakpoint
ALTER TABLE "comment_reply_likes" ADD CONSTRAINT "unique_user_reply_like" UNIQUE("user_id","comment_reply_id");--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "unique_user_post_like" UNIQUE("user_id","post_id");