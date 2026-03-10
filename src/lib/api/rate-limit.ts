interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>()

  return function check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now >= entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true }
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      return { allowed: false, retryAfter }
    }

    entry.count += 1
    return { allowed: true }
  }
}

const ONE_MINUTE = 60_000

export const adminApiLimiter = createRateLimiter(60, ONE_MINUTE)
export const authLimiter = createRateLimiter(10, ONE_MINUTE)
export const contactLimiter = createRateLimiter(10, ONE_MINUTE)
export const contactBurstLimiter = createRateLimiter(3, 10_000)
export const uploadLimiter = createRateLimiter(20, ONE_MINUTE)
