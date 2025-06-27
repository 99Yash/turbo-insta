import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  authorizedParties: ["https://instagram.ygkr.live", "http://localhost:3000"],
});

export const config = {
  publicRoutes: ["/api/webhooks(.*)"],
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
