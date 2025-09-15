import { RateLimiter, RATE_LIMITS, getUserIdentifier } from '../src/lib/rate-limit';

// Mock Request object for testing
function createMockRequest(userId?: string, ip?: string): Request {
  const headers = new Headers();
  if (userId) {
    headers.set('x-user-id', userId);
  }
  if (ip) {
    headers.set('x-forwarded-for', ip);
  }
  
  return new Request('http://localhost:3000/api/test', {
    method: 'POST',
    headers,
  });
}

describe('Rate Limiting', () => {
  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 1000, // 1 second for testing
        maxRequests: 3,
        message: 'Test rate limit exceeded',
      });
    });

    it('should allow requests within limit', () => {
      const result1 = rateLimiter.checkLimit('user1');
      const result2 = rateLimiter.checkLimit('user1');
      const result3 = rateLimiter.checkLimit('user1');

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests exceeding limit', () => {
      // Make 3 requests (at limit)
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user1');

      // 4th request should be blocked
      const result = rateLimiter.checkLimit('user1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toBe('Test rate limit exceeded');
    });

    it('should track different users separately', () => {
      // User 1 makes 3 requests
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user1');

      // User 2 should still be allowed
      const result = rateLimiter.checkLimit('user2');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should handle multiple request counts', () => {
      const result = rateLimiter.checkLimit('user1', 2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      const result2 = rateLimiter.checkLimit('user1', 1);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
    });

    it('should provide correct status without incrementing', () => {
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user1');

      const status = rateLimiter.getStatus('user1');
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(1);

      // Status should not change after calling getStatus
      const status2 = rateLimiter.getStatus('user1');
      expect(status2.remaining).toBe(1);
    });

    it('should reset rate limit for user', () => {
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user1');

      // Should be at limit
      expect(rateLimiter.getStatus('user1').allowed).toBe(false);

      // Reset
      rateLimiter.reset('user1');

      // Should be allowed again
      expect(rateLimiter.getStatus('user1').allowed).toBe(true);
      expect(rateLimiter.getStatus('user1').remaining).toBe(3);
    });
  });

  describe('getUserIdentifier', () => {
    it('should use user ID when available', () => {
      const req = createMockRequest('user123');
      const identifier = getUserIdentifier(req);
      expect(identifier).toBe('user:user123');
    });

    it('should fallback to IP address when no user ID', () => {
      const req = createMockRequest(undefined, '192.168.1.1');
      const identifier = getUserIdentifier(req);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should handle forwarded IP addresses', () => {
      const req = createMockRequest(undefined, '192.168.1.1, 10.0.0.1');
      const identifier = getUserIdentifier(req);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should handle unknown IP', () => {
      const req = createMockRequest();
      const identifier = getUserIdentifier(req);
      expect(identifier).toBe('ip:unknown');
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should have correct buyer creation limits', () => {
      expect(RATE_LIMITS.BUYER_CREATE.maxRequests).toBe(10);
      expect(RATE_LIMITS.BUYER_CREATE.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it('should have correct buyer update limits', () => {
      expect(RATE_LIMITS.BUYER_UPDATE.maxRequests).toBe(50);
      expect(RATE_LIMITS.BUYER_UPDATE.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });
});
