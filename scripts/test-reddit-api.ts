/**
 * Simple script to test Reddit API functionality
 * Run with: npx tsx scripts/test-reddit-api.ts
 */

import { RedditApiClient } from '../src/lib/reddit-api';

async function testRedditApi() {
  console.log('🚀 Testing Reddit API...\n');

  const client = new RedditApiClient({
    userAgent: 'RedditKarmaTracker/1.0 (Test Script)',
  });

  try {
    // Test 1: Fetch user data for u/funnysomething
    console.log('📊 Fetching data for u/funnysomething...');
    const userData = await client.fetchUserData('funnysomething');
    console.log('✅ Success!', userData);
    console.log('');

    // Test 2: Check if user exists
    console.log('🔍 Checking if u/funnysomething exists...');
    const exists = await client.userExists('funnysomething');
    console.log('✅ User exists:', exists);
    console.log('');

    // Test 3: Test non-existent user
    console.log('❌ Testing non-existent user...');
    const nonExistentExists = await client.userExists('thisuserdoesnotexist12345xyz');
    console.log('✅ Non-existent user check:', nonExistentExists);
    console.log('');

    // Test 4: Rate limit status
    console.log('⏱️  Rate limit status:');
    const rateLimitStatus = client.getRateLimitStatus();
    console.log('✅ Rate limit info:', rateLimitStatus);
    console.log('');

    console.log('🎉 All Reddit API tests passed!');

  } catch (error) {
    console.error('❌ Error testing Reddit API:', (error as Error).message);
    process.exit(1);
  }
}

// Run the test
testRedditApi();