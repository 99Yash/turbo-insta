/**
 * Webhook Security Configuration
 *
 * Centralized configuration for webhook rate limiting, security thresholds,
 * and memory management settings.
 */

export type WebhookConfig = {
  readonly rateLimit: {
    readonly normal: {
      readonly limit: number;
      readonly windowMinutes: number;
    };
    readonly suspicious: {
      readonly limit: number;
      readonly windowHours: number;
    };
    readonly fallback: {
      readonly maxRequests: number;
      readonly windowMs: number;
    };
  };
  readonly security: {
    readonly suspiciousThreshold: number;
    readonly suspiciousExpiryHours: number;
    readonly maxRequestSizeMB: number;
  };
  readonly maintenance: {
    readonly cleanupIntervalMinutes: number;
  };
};

/**
 * Default webhook configuration
 *
 * These values provide a good balance between security and usability.
 * Adjust based on your specific traffic patterns and security requirements.
 */
export const webhookConfig: WebhookConfig = {
  rateLimit: {
    // Normal traffic rate limiting via Unkey
    normal: {
      limit: 10, // 10 requests per minute per IP
      windowMinutes: 1, // 1 minute window
    },
    // Suspicious IP rate limiting (more restrictive)
    suspicious: {
      limit: 3, // Only 3 requests per hour for suspicious IPs
      windowHours: 1, // 1 hour window
    },
    // Fallback rate limiting (when Unkey is unavailable)
    fallback: {
      maxRequests: 10, // Same as normal limit
      windowMs: 60 * 1000, // 1 minute in milliseconds
    },
  },
  security: {
    suspiciousThreshold: 20, // Mark IP as suspicious after 20 failed attempts
    suspiciousExpiryHours: 24, // Suspicious marking expires after 24 hours
    maxRequestSizeMB: 1, // Maximum 1MB request payload
  },
  maintenance: {
    cleanupIntervalMinutes: 5, // Clean up memory stores every 5 minutes
  },
} as const;

/**
 * Computed configuration values
 */
export const computedConfig = {
  maxRequestSizeBytes: webhookConfig.security.maxRequestSizeMB * 1024 * 1024,
  suspiciousExpiryMs:
    webhookConfig.security.suspiciousExpiryHours * 60 * 60 * 1000,
  cleanupIntervalMs:
    webhookConfig.maintenance.cleanupIntervalMinutes * 60 * 1000,
  unkey: {
    normalDuration: `${webhookConfig.rateLimit.normal.windowMinutes}m` as const,
    suspiciousDuration:
      `${webhookConfig.rateLimit.suspicious.windowHours}h` as const,
  },
} as const;

/**
 * Environment-specific configuration overrides
 *
 * You can uncomment and modify these for different environments:
 */

// Development environment (more permissive)
// export const devConfig: Partial<WebhookConfig> = {
//   rateLimit: {
//     ...webhookConfig.rateLimit,
//     normal: { limit: 20, windowMinutes: 1 },
//   },
//   security: {
//     ...webhookConfig.security,
//     suspiciousThreshold: 50,
//     suspiciousExpiryHours: 1,
//   },
// };

// Production high-traffic environment (more restrictive)
// export const prodHighTrafficConfig: Partial<WebhookConfig> = {
//   rateLimit: {
//     ...webhookConfig.rateLimit,
//     normal: { limit: 5, windowMinutes: 1 },
//     suspicious: { limit: 1, windowHours: 1 },
//   },
//   security: {
//     ...webhookConfig.security,
//     suspiciousThreshold: 10,
//     maxRequestSizeMB: 0.5,
//   },
// };

/**
 * Get the current active configuration
 *
 * You can modify this function to return different configs based on NODE_ENV
 * or other environment variables.
 */
export const getWebhookConfig = (): WebhookConfig => {
  // For now, always return the default config
  // You can add environment-specific logic here later
  return webhookConfig;
};
