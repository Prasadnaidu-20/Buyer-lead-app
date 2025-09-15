// Simple in-memory rate limiting without external dependencies

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Buyer creation: 10 per hour
  BUYER_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many buyer creation requests. Please try again later.',
  },
  
  // Buyer updates: 50 per hour
  BUYER_UPDATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Too many buyer update requests. Please try again later.',
  },
} as const;

// Simple in-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = config;
  }
  
  /**
   * Check if request is allowed based on rate limit
   * @param identifier - Unique identifier (user ID, IP, etc.)
   * @param requestCount - Number of requests to check (default: 1)
   * @returns Rate limit result
   */
  checkLimit(identifier: string, requestCount: number = 1): RateLimitResult {
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const key = `${identifier}:${windowStart}`;
    
    // Get current request count for this window
    const current = rateLimitStore.get(key);
    const currentCount = current ? current.count : 0;
    const newCount = currentCount + requestCount;
    
    // Check if limit would be exceeded
    if (newCount > this.config.maxRequests) {
      const resetTime = windowStart + this.config.windowMs;
      const remaining = Math.max(0, this.config.maxRequests - currentCount);
      
      return {
        allowed: false,
        remaining,
        resetTime,
        message: this.config.message,
      };
    }
    
    // Update the count
    rateLimitStore.set(key, {
      count: newCount,
      resetTime: windowStart + this.config.windowMs
    });
    
    const resetTime = windowStart + this.config.windowMs;
    const remaining = this.config.maxRequests - newCount;
    
    return {
      allowed: true,
      remaining,
      resetTime,
    };
  }
  
  /**
   * Get current rate limit status without incrementing
   * @param identifier - Unique identifier
   * @returns Current rate limit status
   */
  getStatus(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const key = `${identifier}:${windowStart}`;
    
    const current = rateLimitStore.get(key);
    const currentCount = current ? current.count : 0;
    const resetTime = windowStart + this.config.windowMs;
    const remaining = Math.max(0, this.config.maxRequests - currentCount);
    
    return {
      allowed: currentCount < this.config.maxRequests,
      remaining,
      resetTime,
    };
  }
  
  /**
   * Reset rate limit for an identifier
   * @param identifier - Unique identifier
   */
  reset(identifier: string): void {
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const key = `${identifier}:${windowStart}`;
    
    rateLimitStore.delete(key);
  }
}

/**
 * Get user identifier from request
 * In a real app, this would extract user ID from JWT token or session
 * For now, we'll use IP address as fallback
 */
export function getUserIdentifier(req: Request): string {
  // Try to get user ID from headers (if authenticated)
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

/**
 * Create rate limiter instances
 */
export const rateLimiters = {
  buyerCreate: new RateLimiter(RATE_LIMITS.BUYER_CREATE),
  buyerUpdate: new RateLimiter(RATE_LIMITS.BUYER_UPDATE),
};

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(
  rateLimiter: RateLimiter,
  requestCount: number = 1
) {
  return function rateLimitMiddleware(
    handler: (req: Request, ...args: any[]) => Promise<Response>
  ) {
    return async function rateLimitedHandler(
      req: Request,
      ...args: any[]
    ): Promise<Response> {
      const identifier = getUserIdentifier(req);
      const result = rateLimiter.checkLimit(identifier, requestCount);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: result.message,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(req, ...args);
      
      // Clone response to add headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      });
      
      return newResponse;
    };
  };
}
