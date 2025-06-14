import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  authorizedParties: ["https://instagram.ygkr.live", "http://localhost:3000"],
});

export const config = {
  publicRoutes: ["/api/webhooks(.*)"],
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes except /api/webhooks
    "/(api(?!\/webhooks)|trpc)(.*)",
  ],
};
