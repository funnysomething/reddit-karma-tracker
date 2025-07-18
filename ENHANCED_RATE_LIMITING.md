# Enhanced Rate Limiting and Retry Logic

This document describes the enhanced rate limiting and retry logic implemented in the Reddit API client as part of the codebase optimization project.

## Overview

The enhanced rate limiting and retry logic provides sophisticated request management with the following key features:

- **Advanced Rate Limiting**: Multiple rate limiting strategies including burst handling and adaptive rate limiting
- **Request Deduplication**: Prevents duplicate API calls for the same resource
- **Intelligent Retry Logic**: Multiple retry strategies with circuit breaker patterns
- **Comprehensive Monitoring**: Detailed metrics and statistics for observability

## Features

### 1. Enhanced Rate Limiter

#### Basic Rate Limiter
- **Window-based limiting**: Controls requests within a time window
- **Burst handling**: Separate limits for burst requests
- **Automatic cleanup**: Removes old request records

#### Token Bucket Rate Limiter
- **Token-based system**: Uses tokens that refill over time
- **Smooth rate limiting**: Provides more consistent request pacing
- **Configurable capacity**: Adjustable token bucket size and refill rate

#### Adaptive Rate Limiter
- **Response-based adaptation**: Adjusts rate limiting based on server responses
- **Error tracking**: Monitors consecutive errors and adjusts delays
- **Server retry-after support**: Respects server-provided retry delays

#### Enhanced Rate Limiter
- **Request deduplication**: Prevents duplicate requests for the same resource
- **Request statistics**: Tracks success rates and performance metrics
- **Comprehensive monitoring**: Provides detailed stats for observability

### 2. Request Deduplication

The request deduplication system prevents multiple identical requests from being made simultaneously:

```typescript
// Automatic deduplication for identical requests
const result1 = client.fetchUserData('username');
const result2 = client.fetchUserData('username'); // Will reuse result1's promise

// Both will receive the same result without making duplicate API calls
const [data1, data2] = await Promise.all([result1, result2]);
```

**Features:**
- **Automatic deduplication**: Identical requests are automatically deduplicated
- **Configurable TTL**: Control how long requests are considered "identical"
- **Memory efficient**: Automatically cleans up completed requests

### 3. Intelligent Retry Strategies

#### Exponential Backoff Strategy
- **Exponential delays**: Delays increase exponentially with each retry
- **Jitter support**: Adds randomness to prevent thundering herd
- **Configurable limits**: Maximum retries and delay caps

#### Linear Backoff Strategy
- **Linear delays**: Delays increase linearly with each retry
- **Predictable timing**: More predictable retry timing
- **Simple configuration**: Easy to understand and configure

#### Fixed Delay Strategy
- **Consistent delays**: Same delay between all retries
- **Simple implementation**: Minimal configuration required
- **Predictable behavior**: Easy to reason about timing

#### Adaptive Retry Strategy
- **Error pattern learning**: Adapts based on historical error patterns
- **Dynamic adjustment**: Adjusts retry behavior based on error frequency
- **Intelligent backoff**: More conservative during high error periods

#### Circuit Breaker Strategy
- **Circuit breaker pattern**: Prevents cascading failures
- **State management**: Closed, open, and half-open states
- **Automatic recovery**: Attempts to recover after timeout periods

#### Intelligent Retry Strategy
- **Multi-factor adaptation**: Considers error types, patterns, and frequency
- **Error classification**: Different handling for different error types
- **Pattern recognition**: Learns from error patterns over time

### 4. Integration with Reddit API Client

The enhanced rate limiting and retry logic is fully integrated into the Reddit API client:

```typescript
import { createRedditClient, AuthenticationMethod } from '../lib/reddit';

// Create client with enhanced features
const client = createRedditClient({
  authMethod: AuthenticationMethod.OAUTH,
  rateLimit: {
    maxRequests: 60,
    windowMs: 60000,
    burstLimit: 10,
    burstWindowMs: 10000
  },
  retry: {
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterMs: 1000
  },
  enableCaching: true
});

// All requests automatically use enhanced rate limiting and retry logic
const result = await client.fetchUserData('username');
```

## Configuration

### Rate Limiting Configuration

```typescript
interface RateLimitConfig {
  maxRequests: number;        // Maximum requests per window
  windowMs: number;           // Time window in milliseconds
  retryAfterMs: number;       // Base retry delay
  burstLimit?: number;        // Maximum burst requests
  burstWindowMs?: number;     // Burst time window
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number;         // Maximum retry attempts
  baseDelayMs: number;        // Base delay between retries
  maxDelayMs: number;         // Maximum delay cap
  backoffMultiplier: number;  // Exponential backoff multiplier
  jitterMs: number;           // Random jitter amount
}
```

## Monitoring and Observability

### Rate Limiter Statistics

```typescript
// Get comprehensive rate limiter stats
const stats = client.getEnhancedRateLimiterStats();

console.log('Rate Limit Status:', stats.rateLimitStatus);
console.log('Adaptive Status:', stats.adaptiveStatus);
console.log('Request Stats:', stats.requestStats);
console.log('Deduplication Stats:', stats.deduplicationStats);
```

### Retry Manager Statistics

```typescript
// Get retry manager stats
const retryStats = client.getRetryManagerStats();

console.log('Strategy Info:', retryStats.strategyInfo);
console.log('Operation Metrics:', retryStats.allMetrics);
```

### Available Metrics

#### Rate Limiter Metrics
- **Request counts**: Total, successful, and failed requests
- **Success rate**: Percentage of successful requests
- **Requests per second**: Current request rate
- **Pending requests**: Number of deduplicated requests
- **Adaptive delays**: Current adaptive delay values

#### Retry Manager Metrics
- **Retry attempts**: Number of retry attempts per operation
- **Success after retry**: Operations that succeeded after retrying
- **Total delay time**: Time spent waiting for retries
- **Error patterns**: Frequency of different error types

## Best Practices

### 1. Configuration
- **Start conservative**: Begin with lower rate limits and increase as needed
- **Monitor metrics**: Use the provided statistics to optimize configuration
- **Consider burst patterns**: Configure burst limits for typical usage patterns

### 2. Error Handling
- **Handle non-retryable errors**: Some errors (like user not found) shouldn't be retried
- **Implement fallbacks**: Have fallback strategies for when all retries fail
- **Log appropriately**: Use the built-in logging for debugging and monitoring

### 3. Performance
- **Enable caching**: Use caching to reduce API calls
- **Batch requests**: Use batch operations when possible
- **Monitor deduplication**: Check deduplication stats to ensure it's working effectively

### 4. Testing
- **Test rate limiting**: Verify rate limiting works under load
- **Test retry logic**: Simulate failures to test retry behavior
- **Monitor in production**: Use metrics to ensure optimal performance

## Migration Guide

If you're upgrading from the basic rate limiting and retry logic:

### 1. Update Imports
```typescript
// Old
import { RateLimiter } from '../lib/reddit/rate-limiter';

// New
import { EnhancedRateLimiter } from '../lib/reddit/rate-limiter';
```

### 2. Update Configuration
```typescript
// Old basic configuration
const rateLimiter = new RateLimiter(config);

// New enhanced configuration
const rateLimiter = new EnhancedRateLimiter(config);
```

### 3. Use Enhanced Features
```typescript
// Request deduplication is automatic
const result = await rateLimiter.executeRequest(
  'user:username',
  () => fetchUserData('username'),
  { deduplicate: true }
);

// Get enhanced statistics
const stats = rateLimiter.getRequestStats();
const dedupeStats = rateLimiter.getDeduplicationStats();
```

## Troubleshooting

### Common Issues

#### High Error Rates
- **Check rate limits**: Ensure rate limits aren't too aggressive
- **Monitor adaptive delays**: Check if adaptive rate limiting is increasing delays
- **Review retry strategy**: Consider switching to a more conservative retry strategy

#### Slow Response Times
- **Check deduplication**: Ensure request deduplication is working
- **Monitor retry delays**: Check if retry delays are too high
- **Review cache hit rates**: Ensure caching is effective

#### Memory Usage
- **Monitor pending requests**: Check deduplication stats for memory leaks
- **Clean up old metrics**: Ensure old metrics are being cleaned up
- **Review cache size**: Check cache configuration and usage

### Debugging

Enable debug logging to get detailed information about rate limiting and retry behavior:

```typescript
import { getLogger } from '../lib/logging';

const logger = getLogger('reddit-oauth');
logger.setLevel('DEBUG');
```

This will provide detailed logs about:
- Rate limiting decisions
- Retry attempts and delays
- Request deduplication
- Error classification and handling

## Performance Impact

The enhanced rate limiting and retry logic is designed to be performant:

- **Minimal overhead**: Rate limiting checks are O(1) operations
- **Memory efficient**: Automatic cleanup prevents memory leaks
- **CPU efficient**: Uses efficient data structures and algorithms
- **Network efficient**: Reduces redundant API calls through deduplication

## Future Enhancements

Planned improvements include:

- **Distributed rate limiting**: Support for rate limiting across multiple instances
- **Machine learning**: ML-based adaptive rate limiting
- **Advanced metrics**: More detailed performance and error analytics
- **Custom strategies**: Plugin system for custom retry strategies