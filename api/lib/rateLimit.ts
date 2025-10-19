/**
 * Rate Limiting
 * Simple in-memory rate limiter for API requests
 */

// Rate limit store (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Configuration
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

/**
 * Check if user has exceeded rate limit
 */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // Reset rate limit
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

