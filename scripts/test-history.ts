/**
 * Test user history functionality
 * Run with: npx tsx scripts/test-history.ts [BASE_URL] [USERNAME]
 */

const HISTORY_BASE_URL = process.argv[2] || 'http://localhost:3000';
const TEST_USERNAME = process.argv[3] || 'spez';

async function testUserHistory() {
  console.log(`📊 Testing User History at: ${HISTORY_BASE_URL}\n`);

  try {
    console.log(`📤 Fetching history for user: ${TEST_USERNAME}`);
    console.log(`   URL: ${HISTORY_BASE_URL}/api/users/${TEST_USERNAME}/history`);
    console.log(`   Method: GET`);
    console.log('');

    const response = await fetch(`${HISTORY_BASE_URL}/api/users/${TEST_USERNAME}/history`);

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    const responseText = await response.text();
    console.log(`📄 Raw Response (first 1000 chars):`);
    console.log(responseText.substring(0, 1000));
    console.log('');

    try {
      const data = JSON.parse(responseText);
      console.log(`✅ Parsed JSON Response:`);
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log(`🎉 SUCCESS: History API working!`);
        console.log(`   User: ${TEST_USERNAME}`);
        console.log(`   History entries: ${data.data?.length || 0}`);
        
        if (data.data && data.data.length > 0) {
          console.log(`\n📈 History Data:`);
          data.data.forEach((entry: any, index: number) => {
            console.log(`   ${index + 1}. ${entry.collected_at}: Karma=${entry.karma}, Posts=${entry.post_count}`);
          });
        } else {
          console.log(`\n⚠️  No history data found for ${TEST_USERNAME}`);
          console.log(`   This could mean:`);
          console.log(`   • User was just added and no data collected yet`);
          console.log(`   • Cron job hasn't run yet`);
          console.log(`   • User data collection failed`);
        }
      } else {
        console.log(`❌ History API Error: ${data.error}`);
        
        if (data.error?.includes('not currently being tracked')) {
          console.log(`\n💡 User ${TEST_USERNAME} is not being tracked yet.`);
          console.log(`   Add the user first: npm run test:add-user:vercel`);
        }
      }
    } catch (parseError) {
      console.log(`❌ JSON Parse Error: ${(parseError as Error).message}`);
      console.log(`💡 This suggests the API returned HTML instead of JSON`);
    }

  } catch (error) {
    console.log(`❌ Network Error: ${(error as Error).message}`);
  }

  console.log('\n🔧 Debugging Tips:');
  console.log('================');
  console.log('1. Make sure the user is added to tracking first');
  console.log('2. Run the cron job to collect initial data');
  console.log('3. Check Supabase user_history table directly');
  console.log('4. Verify the user exists in tracked_users table');
}

// Test multiple users if they exist
async function testMultipleUsersHistory() {
  console.log(`\n📊 Testing Multiple Users History...\n`);
  
  const testUsers = ['spez', 'funnysomething', 'AutoModerator'];
  
  for (const username of testUsers) {
    try {
      console.log(`🔍 Testing ${username}...`);
      const response = await fetch(`${HISTORY_BASE_URL}/api/users/${username}/history`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ ${username}: ${data.data?.length || 0} history entries`);
      } else {
        console.log(`   ❌ ${username}: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ${username}: Network error`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Run both tests
async function runHistoryTests() {
  await testUserHistory();
  await testMultipleUsersHistory();
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. If no history data, run: npm run test:cron:vercel');
  console.log('2. Check the main app UI to see if charts display');
  console.log('3. Add more users and collect data over time');
  console.log('4. Monitor Supabase tables for data consistency');
}

runHistoryTests().catch(error => {
  console.error('❌ History test failed:', error);
  process.exit(1);
});