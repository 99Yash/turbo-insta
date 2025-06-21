import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { commentsRouter } from "./routers/comments.router";
import { likesRouter } from "./routers/likes.router";
import { messagesRouter } from "./routers/messages.router";
import { notificationsRouter } from "./routers/notifications.router";
import { postsRouter } from "./routers/posts.router";
import { userRouter } from "./routers/user.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  posts: postsRouter,
  comments: commentsRouter,
  likes: likesRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
