/**
 * In-Memory Rate Limiter
 * 
 * Lightweight rate limiting for shared hosting environments.
 * Uses sliding window algorithm with automatic cleanup.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store - resets on server restart (acceptable for this use case)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request is allowed based on rate limits
 * @param key - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // No entry or expired - create new
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs
    }
  }

  if (entry.count >= config.maxAttempts) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  // Increment counter
  entry.count++
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Get client IP from request headers
 * Handles various proxy configurations
 */
export function getClientIP(request: Request): string {
  // Check X-Forwarded-For header (most common for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim()
  }

  // Check X-Real-IP header (used by some proxies)
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Fallback to a default (should not happen in production)
  return 'unknown'
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Login: 5 attempts per 15 minutes
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  
  // Registration: 3 accounts per hour per IP
  REGISTER: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  
  // Password reset: 3 attempts per hour
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  
  // Email verification: 5 attempts per hour
  EMAIL_VERIFY: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  
  // API general: 100 requests per minute
  API_GENERAL: { maxAttempts: 100, windowMs: 60 * 1000 },
  
  // Article creation: 10 articles per hour (prevent content spam)
  ARTICLE_CREATE: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },
  
  // File upload: 20 uploads per hour (prevent storage abuse)
  FILE_UPLOAD: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
} as const
