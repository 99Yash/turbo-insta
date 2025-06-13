ALTER TABLE "comment_likes" DROP CONSTRAINT "unique_user_comment_like";--> statement-breakpoint
ALTER TABLE "comment_reply_likes" DROP CONSTRAINT "unique_user_reply_like";--> statement-breakpoint
ALTER TABLE "likes" DROP CONSTRAINT "unique_user_post_like";