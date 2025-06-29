import { Ratelimit } from "@unkey/ratelimit";
import { env } from "~/env";
import { computedConfig, getWebhookConfig } from "./webhook-config";

/**
 * Unkey Rate Limiting Configuration
 *
 * This file initializes and exports all Unkey rate limiters used by the webhook endpoint.
 * Configuration values are sourced from the webhook config.
 */

// Get the active webhook configuration
const config = getWebhookConfig();

/**
 * Normal traffic rate limiter
 *
 * Applied to all incoming webhook requests under normal circumstances.
 */
export const webhookRateLimit = new Ratelimit({
  rootKey: env.UNKEY_ROOT_KEY,
  namespace: "webhook",
  limit: config.rateLimit.normal.limit,
  duration: computedConfig.unkey.normalDuration,
});

/**
 * Suspicious IP rate limiter
 *
 * Applied to IPs that have been marked as suspicious due to failed attempts.
 * Much more restrictive than the normal rate limiter.
 */
export const suspiciousIPRateLimit = new Ratelimit({
  rootKey: env.UNKEY_ROOT_KEY,
  namespace: "webhook-suspicious",
  limit: config.rateLimit.suspicious.limit,
  duration: computedConfig.unkey.suspiciousDuration,
});

/**
 * Configuration constants exported for use in the webhook route
 */
export const webhookConstants = {
  maxRequestSizeBytes: computedConfig.maxRequestSizeBytes,
  suspiciousThreshold: config.security.suspiciousThreshold,
  suspiciousExpiryMs: computedConfig.suspiciousExpiryMs,
  fallbackRateLimit: {
    windowMs: config.rateLimit.fallback.windowMs,
    maxRequests: config.rateLimit.fallback.maxRequests,
  },
  cleanupIntervalMs: computedConfig.cleanupIntervalMs,
  config, // Export the full config for logging/debugging
} as const;

/**
 * Rate limiting utility function
 *
 * @param ip - The IP address to check
 * @param isSuspicious - Whether to use the suspicious IP rate limiter
 * @returns Rate limit result with success status and metadata
 */
export async function checkWebhookRateLimit(
  ip: string,
  isSuspicious = false,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  try {
    const rateLimiter = isSuspicious ? suspiciousIPRateLimit : webhookRateLimit;
    const result = await rateLimiter.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    console.warn(`[WEBHOOK] Unkey rate limiting failed:`, error);

    // Return failure state to trigger fallback in the webhook route
    throw error;
  }
}
