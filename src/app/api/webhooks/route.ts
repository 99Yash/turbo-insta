import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { Ratelimit } from "@unkey/ratelimit";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { env } from "~/env";
import { generateUniqueUsername } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

// Initialize Unkey rate limiting
const ratelimit = new Ratelimit({
  rootKey: env.UNKEY_ROOT_KEY, // Add this to your .env file
  namespace: "webhook",
  limit: 10,
  duration: "1m", // 10 requests per minute
});

// Suspicious activity rate limiter (more restrictive)
const suspiciousRatelimit = new Ratelimit({
  rootKey: env.UNKEY_ROOT_KEY,
  namespace: "webhook-suspicious",
  limit: 3,
  duration: "1h", // Only 3 requests per hour for suspicious IPs
});

// Request size limit (1MB)
const MAX_REQUEST_SIZE = 1024 * 1024;

// In-memory suspicious IP tracking (fallback)
const suspiciousIPs = new Set<string>();
const SUSPICIOUS_THRESHOLD = 20; // Block after 20 failed attempts in 24h

// Fallback rate limiting store for when Unkey fails
const fallbackRateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function getRealIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return realIP ?? request.ip ?? "unknown";
}

function isFallbackRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = fallbackRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    fallbackRateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

function trackSuspiciousActivity(ip: string, reason: string): void {
  console.warn(`[WEBHOOK SECURITY] Suspicious activity from ${ip}: ${reason}`);

  // For now, we'll use simple in-memory tracking
  // In production, you might want to use a database or Redis
  const key = `${ip}:failed`;
  const existing = fallbackRateLimitStore.get(key);
  const count = (existing?.count ?? 0) + 1;

  fallbackRateLimitStore.set(key, {
    count,
    resetTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hour window
  });

  if (count >= SUSPICIOUS_THRESHOLD) {
    suspiciousIPs.add(ip);
    console.error(
      `[WEBHOOK SECURITY] IP ${ip} marked as suspicious after ${count} failed attempts`,
    );
  }
}

async function checkRateLimit(
  ip: string,
  isSuspicious = false,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  try {
    const rateLimiter = isSuspicious ? suspiciousRatelimit : ratelimit;
    const result = await rateLimiter.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    console.warn(
      `[WEBHOOK] Unkey rate limiting failed, using fallback:`,
      error,
    );

    // Fallback to in-memory rate limiting
    const isLimited = isFallbackRateLimited(ip);
    return {
      success: !isLimited,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: isLimited
        ? 0
        : RATE_LIMIT_MAX_REQUESTS -
          (fallbackRateLimitStore.get(ip)?.count ?? 1),
      reset: new Date(Date.now() + RATE_LIMIT_WINDOW),
    };
  }
}

async function generateFallbackUsername(name: string): Promise<string> {
  // Simple fallback without AI to avoid expensive calls during attacks
  const baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 15);

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseUsername || "user"}${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip = getRealIP(req);

  try {
    // Early security checks
    if (suspiciousIPs.has(ip)) {
      console.error(
        `[WEBHOOK SECURITY] Blocked request from suspicious IP: ${ip}`,
      );
      return new Response("Forbidden", { status: 403 });
    }

    // Check rate limiting with Unkey
    const isSuspiciousIP =
      suspiciousIPs.has(ip) ||
      (fallbackRateLimitStore.get(`${ip}:failed`)?.count ?? 0) > 5;
    const rateLimitResult = await checkRateLimit(ip, isSuspiciousIP);

    if (!rateLimitResult.success) {
      trackSuspiciousActivity(ip, "Rate limit exceeded");
      console.warn(
        `[WEBHOOK SECURITY] Rate limited ${ip}: ${rateLimitResult.remaining}/${rateLimitResult.limit}, resets at ${rateLimitResult.reset.toISOString()}`,
      );

      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.getTime().toString(),
          "Retry-After": Math.ceil(
            (rateLimitResult.reset.getTime() - Date.now()) / 1000,
          ).toString(),
        },
      });
    }

    // Log successful rate limit check
    if (rateLimitResult.remaining < 3) {
      console.warn(
        `[WEBHOOK] Rate limit warning for ${ip}: ${rateLimitResult.remaining}/${rateLimitResult.limit} remaining`,
      );
    }

    // Check request size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      trackSuspiciousActivity(ip, `Request too large: ${contentLength} bytes`);
      return new Response("Payload Too Large", { status: 413 });
    }

    // Method check (redundant but kept for safety)
    if (req.method !== "POST") {
      trackSuspiciousActivity(ip, `Invalid method: ${req.method}`);
      return new Response("Method not allowed", { status: 405 });
    }

    // Early webhook verification - this is the most expensive operation
    let evt;
    try {
      evt = await verifyWebhook(req);
    } catch (verificationError) {
      trackSuspiciousActivity(ip, "Webhook verification failed");
      console.error(
        `[WEBHOOK] Verification failed from ${ip}:`,
        verificationError,
      );
      return new Response("Unauthorized", { status: 401 });
    }

    console.log(
      `[WEBHOOK] Processing ${evt.type} from ${ip} (${rateLimitResult.remaining}/${rateLimitResult.limit} remaining)`,
    );

    switch (evt.type) {
      case "user.created": {
        const {
          id: clerkId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = evt.data;

        if (!email_addresses?.[0]?.email_address) {
          console.error(
            `[WEBHOOK] No email address found for user: ${clerkId}`,
          );
          return new Response("No email address found", { status: 400 });
        }

        const name =
          `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";

        // Use fallback username generation for suspicious IPs to prevent AI abuse
        let username: string;
        const failedAttempts =
          fallbackRateLimitStore.get(`${ip}:failed`)?.count ?? 0;

        if (failedAttempts > 5 || isSuspiciousIP) {
          console.warn(
            `[WEBHOOK] Using fallback username generation for IP ${ip} due to previous failures or suspicious activity`,
          );
          username = await generateFallbackUsername(name);
        } else {
          try {
            username = await generateUniqueUsername(name);
          } catch (aiError) {
            console.warn(
              `[WEBHOOK] AI username generation failed, using fallback:`,
              aiError,
            );
            username = await generateFallbackUsername(name);
          }
        }

        try {
          console.log(
            `[WEBHOOK] Creating user in database: ${clerkId} (${name})`,
          );

          await db.insert(users).values({
            id: clerkId,
            email: email_addresses[0].email_address,
            name,
            username,
            imageUrl: image_url,
            isVerified: false,
          });

          console.log(`[WEBHOOK] ✅ User created successfully: ${username}`);

          const cc = await clerkClient();
          await cc.users.updateUser(clerkId, {
            username,
          });

          console.log(
            `[WEBHOOK] ✅ Clerk user updated with username: ${username}`,
          );
        } catch (e) {
          console.error(`[WEBHOOK] ❌ Error creating user in database:`, e);
          return new Response("Failed to create user", { status: 500 });
        }
        break;
      }
      case "user.updated": {
        const {
          id: clerkId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = evt.data;

        if (!email_addresses?.[0]?.email_address) {
          console.error(
            `[WEBHOOK] No email address found for user: ${clerkId}`,
          );
          return new Response("No email address found", { status: 400 });
        }

        const name =
          `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";

        // Only generate new username if current user doesn't have one
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, clerkId),
          columns: { username: true },
        });

        if (!existingUser) {
          console.error(`[WEBHOOK] User not found in database: ${clerkId}`);
          return new Response("User not found", { status: 404 });
        }

        let username = existingUser.username;
        if (!username) {
          const failedAttempts =
            fallbackRateLimitStore.get(`${ip}:failed`)?.count ?? 0;

          if (failedAttempts > 5 || isSuspiciousIP) {
            username = await generateFallbackUsername(name);
          } else {
            try {
              username = await generateUniqueUsername(name);
            } catch (aiError) {
              console.warn(
                `[WEBHOOK] AI username generation failed, using fallback:`,
                aiError,
              );
              username = await generateFallbackUsername(name);
            }
          }
        }

        try {
          await db
            .update(users)
            .set({
              email: email_addresses[0].email_address,
              name,
              username,
              imageUrl: image_url,
            })
            .where(eq(users.id, clerkId));

          console.log(`[WEBHOOK] ✅ Updated user: ${username}`);

          const cc = await clerkClient();
          await cc.users.updateUser(clerkId, {
            username,
          });
        } catch (error) {
          console.error(`[WEBHOOK] ❌ Error updating user:`, error);
          return new Response("Failed to update user", { status: 500 });
        }
        break;
      }
      case "user.deleted":
        console.log(
          `[WEBHOOK] User deletion event received (no action needed)`,
        );
        break;
      case "session.created":
        console.log(
          `[WEBHOOK] Session creation event received (no action needed)`,
        );
        break;
      default:
        console.log(`[WEBHOOK] Unhandled event type: ${evt.type}`);
        break;
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `[WEBHOOK] ✅ Processing completed in ${processingTime}ms for IP ${ip} (Rate limit: ${rateLimitResult.remaining}/${rateLimitResult.limit})`,
    );

    return new Response("Success", {
      status: 200,
      headers: {
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.reset.getTime().toString(),
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    trackSuspiciousActivity(ip, "Processing error");

    console.error(
      `[WEBHOOK] ❌ Processing error after ${processingTime}ms from IP ${ip}:`,
      error,
    );

    // Log more details about the error
    if (error instanceof Error) {
      console.error(`[WEBHOOK] Error message:`, error.message);
      console.error(`[WEBHOOK] Error stack:`, error.stack);
    }

    return new Response("Internal server error", { status: 500 });
  }
}

// Cleanup function to prevent memory leaks from fallback store
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of fallbackRateLimitStore.entries()) {
      if (now > record.resetTime) {
        fallbackRateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
); // Cleanup every 5 minutes
