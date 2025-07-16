/**
 * Test Reddit API with multiple users
 * Run with: npx tsx scripts/test-multiple-users.ts
 */

import { RedditApiClient } from '../src/lib/reddit-api';

async function testMultipleUsers() {
  console.log('🚀 Testing Reddit API with multiple users...\n');

  const client = new RedditApiClient({
    userAgent: 'RedditKarmaTracker/1.0 (Multi-User Test)',
    rateLimit: {
      maxRequests: 30,
      windowMs: 60000, // 1 minute
      retryAfterMs: 2000
    }
  });

  // Test users - mix of likely existing and non-existing
  const testUsers = [
    'funnysomething',
    'spez', // Reddit CEO - should exist
    'thisuserdoesnotexist12345xyz', // Should not exist
    'AutoModerator', // Reddit bot - should exist
    'anotherfakeuser999888777' // Should not exist
  ];

  console.log('📊 Testing users:', testUsers.join(', '));
  console.log('');

  for (const username of testUsers) {
    try {
      console.log(`🔍 Testing user: u/${username}`);
      
      // Check if user exists first
      const exists = await client.userExists(username);
      console.log(`   Exists: ${exists}`);
      
      if (exists) {
        // If user exists, fetch their data
        const userData = await client.fetchUserData(username);
        console.log(`   Data:`, userData);
      } else {
        console.log(`   ⚠️  User does not exist - skipping data fetch`);
      }
      
      console.log('');
      
      // Small delay to be respectful to Reddit's API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Error testing u/${username}:`, (error as Error).message);
      console.log('');
    }
  }

  // Show final rate limit status
  const finalStatus = client.getRateLimitStatus();
  console.log('⏱️  Final rate limit status:', finalStatus);
  console.log('');
  console.log('🎉 Multi-user test completed!');
}

// Run the test
testMultipleUsers().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});