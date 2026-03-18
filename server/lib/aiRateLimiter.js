const rateLimitMap = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15;     // Stay under OpenRouter's 20/min

/**
 * Check if a user has exceeded the AI generation rate limit.
 * @param {string} userId
 * @returns {{ limited: boolean, retryAfter: number }}
 */
export function checkRateLimit(userId) {
  const now = Date.now();

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  // Keep only timestamps within the current window
  const timestamps = rateLimitMap
    .get(userId)
    .filter((t) => now - t < WINDOW_MS);

  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);

  if (timestamps.length > MAX_REQUESTS) {
    return {
      limited: true,
      retryAfter: Math.ceil(WINDOW_MS / 1000),
    };
  }

  return { limited: false, retryAfter: 0 };
}
