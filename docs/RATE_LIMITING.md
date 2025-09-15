# Rate Limiting Implementation

This document describes the comprehensive rate limiting system implemented for the Buyer Lead Intake App to prevent abuse and ensure fair usage.

## 🎯 **Overview**

Rate limiting has been implemented on all critical buyer management endpoints to:
- **Prevent abuse** and spam requests
- **Ensure fair usage** across all users
- **Protect server resources** from excessive load
- **Maintain system stability** during high traffic

## 📊 **Rate Limit Configurations**

### **Buyer Creation** (`POST /api/buyers`)
- **Limit**: 10 requests per hour
- **Reasoning**: Creating buyers is a critical operation that should be controlled
- **Message**: "Too many buyer creation requests. Please try again later."

### **Buyer Updates** (`PUT /api/buyers/[id]`)
- **Limit**: 50 requests per hour
- **Reasoning**: Updates are more frequent but still need control
- **Message**: "Too many buyer update requests. Please try again later."

### **CSV Import** (`POST /api/buyers/import`)
- **Limit**: No limit (unrestricted)
- **Reasoning**: Bulk operations should be unrestricted for better user experience
- **Message**: N/A

### **Status Updates** (`PATCH /api/buyers/[id]/status`)
- **Limit**: 50 requests per hour (same as general updates)
- **Reasoning**: Status updates are frequent but should be controlled
- **Message**: "Too many buyer update requests. Please try again later."

### **General API** (No Rate Limiting)
- **Limit**: No limit (unrestricted)
- **Reasoning**: General API endpoints don't need rate limiting
- **Message**: N/A

## 🛠️ **Technical Implementation**

### **Core Components**

#### **1. RateLimiter Class** (`src/lib/rate-limit.ts`)
```typescript
export class RateLimiter {
  checkLimit(identifier: string, requestCount: number = 1): RateLimitResult
  getStatus(identifier: string): RateLimitResult
  reset(identifier: string): void
}
```

#### **2. User Identification**
- **Primary**: User ID from `x-user-id` header (when authenticated)
- **Fallback**: IP address from `x-forwarded-for` header
- **Format**: `user:userId` or `ip:192.168.1.1`

#### **3. In-Memory Storage**
- Uses `Map<string, { count: number; resetTime: number }>` for storage
- Automatic cleanup every 5 minutes to prevent memory leaks
- Time-window based tracking (sliding window)

#### **4. Middleware Integration**
```typescript
export const POST = withRateLimit(rateLimiters.buyerCreate)(createBuyer);
```

### **Rate Limit Headers**

All responses include rate limit information:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640995200000
Retry-After: 3600
```

### **Error Response Format**

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many buyer creation requests. Please try again later.",
  "remaining": 0,
  "resetTime": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 **API Endpoints Protected**

### **1. Buyer Creation** (`POST /api/buyers`)
```typescript
// Before: Direct export
export async function POST(req: Request) { ... }

// After: Rate limited
export const POST = withRateLimit(rateLimiters.buyerCreate)(createBuyer);
```

### **2. Buyer Updates** (`PUT /api/buyers/[id]`)
```typescript
// Before: Direct export
export async function PUT(req: Request, { params }) { ... }

// After: Rate limited
export const PUT = withRateLimit(rateLimiters.buyerUpdate)(updateBuyer);
```

### **3. CSV Import** (`POST /api/buyers/import`)
```typescript
// Before: Direct export
export async function POST(req: Request) { ... }

// After: Rate limited
export const POST = withRateLimit(rateLimiters.csvImport)(importCSV);
```

### **4. Status Updates** (`PATCH /api/buyers/[id]/status`)
```typescript
// Before: Direct export
export async function PATCH(req: Request, { params }) { ... }

// After: Rate limited
export const PATCH = withRateLimit(rateLimiters.buyerUpdate)(updateBuyerStatus);
```

## 🧪 **Testing**

### **Test Coverage**
- **RateLimiter Class**: 8 comprehensive tests
- **User Identification**: 4 tests covering different scenarios
- **Rate Limit Configurations**: 4 tests validating limits
- **Edge Cases**: Multiple request counts, status checking, reset functionality

### **Test Commands**
```bash
# Run all tests
npm test

# Run rate limit tests only
npm test -- --testNamePattern="Rate Limiting"

# Run with coverage
npm run test:coverage
```

### **Test Scenarios Covered**
- ✅ Requests within limit
- ✅ Requests exceeding limit
- ✅ Different users tracked separately
- ✅ Multiple request counts
- ✅ Status checking without incrementing
- ✅ Rate limit reset functionality
- ✅ User ID vs IP address identification
- ✅ Forwarded IP handling

## 📈 **Monitoring & Analytics**

### **Rate Limit Metrics**
- **Request Count**: Tracked per user/IP per time window
- **Remaining Requests**: Available requests in current window
- **Reset Time**: When the rate limit window resets
- **Blocked Requests**: Requests that exceeded limits

### **Headers for Monitoring**
```http
X-RateLimit-Limit: 10        # Maximum requests allowed
X-RateLimit-Remaining: 7     # Requests remaining in window
X-RateLimit-Reset: 1640995200000  # Unix timestamp of reset
```

## 🚀 **Production Considerations**

### **Scalability**
- **Current**: In-memory storage (single server)
- **Recommended**: Redis for multi-server deployments
- **Fallback**: Database-based rate limiting for persistence

### **Configuration Management**
- **Environment Variables**: Different limits for dev/staging/prod
- **Dynamic Limits**: Adjust limits based on user tier/subscription
- **Whitelist**: Bypass rate limits for trusted users/IPs

### **Monitoring Integration**
- **Logging**: Rate limit violations and patterns
- **Alerting**: Unusual spike detection
- **Analytics**: Usage patterns and optimization

## 🔒 **Security Features**

### **User Identification**
- **Authenticated Users**: Tracked by user ID
- **Anonymous Users**: Tracked by IP address
- **Proxy Support**: Handles `x-forwarded-for` headers

### **Attack Prevention**
- **DDoS Protection**: Rate limiting prevents overwhelming requests
- **Brute Force**: Limits prevent automated attacks
- **Resource Protection**: Prevents server overload

## 📝 **Usage Examples**

### **Frontend Integration**
```typescript
// Handle rate limit errors
try {
  const response = await fetch('/api/buyers', {
    method: 'POST',
    body: JSON.stringify(buyerData)
  });
  
  if (response.status === 429) {
    const error = await response.json();
    console.log(`Rate limited. Try again at: ${error.resetTime}`);
    console.log(`Remaining requests: ${error.remaining}`);
  }
} catch (error) {
  // Handle other errors
}
```

### **Backend Monitoring**
```typescript
// Check rate limit status
const status = rateLimiters.buyerCreate.getStatus('user:123');
console.log(`User has ${status.remaining} requests remaining`);
console.log(`Reset time: ${new Date(status.resetTime)}`);
```

## 🎉 **Benefits Achieved**

1. **✅ Abuse Prevention**: Prevents spam and malicious requests
2. **✅ Fair Usage**: Ensures equal access for all users
3. **✅ Resource Protection**: Prevents server overload
4. **✅ User Experience**: Clear error messages and retry information
5. **✅ Monitoring**: Comprehensive tracking and analytics
6. **✅ Scalability**: Easy to extend and modify
7. **✅ Testing**: Full test coverage for reliability

The rate limiting system is now fully implemented and protecting all critical buyer management endpoints! 🛡️
