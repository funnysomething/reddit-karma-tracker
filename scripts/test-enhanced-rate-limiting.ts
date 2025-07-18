#!/usr/bin/env tsx

/**
 * Test script for enhanced rate limiting and retry logic
 * 
 * This script tests the new enhanced rate limiting and retry functionality
 * to ensure it's working correctly with request deduplication, adaptive
 * rate limiting, and intelligent retry strategies.
 */

import { 
  createRedditClient, 
  getEnhancedRateLimiterStats, 
  getRetryManagerStats,
  AuthenticationMethod 
} from '../src/lib/reddit';

async function testEnhancedRateLimiting() {
  console.log('🚀 Testing Enhanced Rate Limiting and Retry Logic\n');

  // Create a client with aggressive rate limiting for testing
  const client = createRedditClient({
    authMethod: AuthenticationMethod.PUBLIC,
    rateLimit: {
      maxRequests: 3,
      windowMs: 10000, // 10 seconds
      retryAfterMs: 1000,
      burstLimit: 2,
      burstWindowMs: 5000 // 5 seconds
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      jitterMs: 100
    },
    enableCaching: true
  });

  console.log('📊 Initial Rate Limiter Stats:');
  const initialStats = (client as any).getEnhancedRateLimiterStats?.();
  if (initialStats) {
    console.log('- Rate Limit Status:', initialStats.rateLimitStatus);
    console.log('- Adaptive Status:', initialStats.adaptiveStatus);
    console.log('- Request Stats:', initialStats.requestStats);
    console.log('- Deduplication Stats:', initialStats.deduplicationStats);
  }

  console.log('\n🔄 Testing Request Deduplication...');
  
  // Test request deduplication by making multiple simultaneous requests
  const testUsername = 'spez'; // Reddit CEO, should exist
  const promises = Array(5).fill(null).map((_, i) => {
    console.log(`  Making request ${i + 1} for user: ${testUsername}`);
    return client.fetchUserData(testUsername, { correlationId: `test-${i}` });
  });

  try {
    const results = await Promise.all(promises);
    console.log(`✅ All ${results.length} requests completed`);
    
    const successful = results.filter(r => r.success).length;
    const fromCache = results.filter(r => r.fromCache).length;
    
    console.log(`  - Successful: ${successful}/${results.length}`);
    console.log(`  - From cache: ${fromCache}/${results.length}`);
    
    if (results[0].success && results[0].data) {
      console.log(`  - User data: ${results[0].data.username} (${results[0].data.karma} karma)`);
    }
  } catch (error) {
    console.log('❌ Request failed:', (error as Error).message);
  }

  console.log('\n📈 Rate Limiter Stats After Requests:');
  const afterStats = (client as any).getEnhancedRateLimiterStats?.();
  if (afterStats) {
    console.log('- Rate Limit Status:', afterStats.rateLimitStatus);
    console.log('- Request Stats:', afterStats.requestStats);
    console.log('- Deduplication Stats:', afterStats.deduplicationStats);
  }

  console.log('\n🔄 Testing Rate Limiting with Multiple Different Users...');
  
  const testUsers = ['spez', 'kn0thing', 'reddit', 'AutoModerator'];
  
  for (const username of testUsers) {
    try {
      console.log(`  Fetching data for: ${username}`);
      const result = await client.fetchUserData(username);
      
      if (result.success && result.data) {
        console.log(`    ✅ ${username}: ${result.data.karma} karma (${result.responseTime}ms)`);
      } else {
        console.log(`    ❌ ${username}: ${result.error}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`    ❌ ${username}: ${(error as Error).message}`);
    }
  }

  console.log('\n📊 Final Stats:');
  const finalStats = (client as any).getEnhancedRateLimiterStats?.();
  if (finalStats) {
    console.log('- Rate Limit Status:', finalStats.rateLimitStatus);
    console.log('- Adaptive Status:', finalStats.adaptiveStatus);
    console.log('- Request Stats:', finalStats.requestStats);
  }

  const retryStats = (client as any).getRetryManagerStats?.();
  if (retryStats) {
    console.log('- Retry Manager Stats:', retryStats);
  }

  console.log('\n🧪 Testing Error Handling and Retry Logic...');
  
  // Test with a non-existent user to trigger retry logic
  try {
    const result = await client.fetchUserData('this_user_definitely_does_not_exist_12345');
    console.log('  Result:', result.success ? 'Success' : `Failed: ${result.error}`);
  } catch (error) {
    console.log('  ❌ Error:', (error as Error).message);
  }

  console.log('\n✅ Enhanced Rate Limiting and Retry Logic Test Complete!');
  
  // Clean up
  client.destroy();
}

// Run the test
if (require.main === module) {
  testEnhancedRateLimiting().catch(console.error);
}

export { testEnhancedRateLimiting };