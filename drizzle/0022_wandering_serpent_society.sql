ALTER TABLE "notifications" ADD COLUMN "comment_reply_like_id" varchar;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_reply_like_id_comment_reply_likes_id_fk" FOREIGN KEY ("comment_reply_like_id") REFERENCES "public"."comment_reply_likes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
