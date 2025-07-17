/**
 * Test the cron job functionality
 * Run with: npx tsx scripts/test-cron.ts [BASE_URL]
 */

const CRON_BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testCronJob() {
  console.log(`🕐 Testing Cron Job at: ${CRON_BASE_URL}\n`);

  try {
    console.log('📤 Triggering manual data collection...');
    console.log(`   URL: ${CRON_BASE_URL}/api/cron/collect-data`);
    console.log(`   Method: GET (manual test)`);
    console.log('');

    const response = await fetch(`${CRON_BASE_URL}/api/cron/collect-data?test=true`, {
      method: 'GET',
    });

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
      
      if (data.error) {
        console.log(`❌ Cron Job Error: ${data.error}`);
        if (data.details) {
          console.log(`   Details: ${data.details}`);
        }
      } else {
        console.log(`🎉 SUCCESS: Cron job executed successfully!`);
        console.log(`   Total Users: ${data.totalUsers}`);
        console.log(`   Collected: ${data.collected}`);
        console.log(`   Errors: ${data.errors}`);
        console.log(`   Timestamp: ${data.timestamp}`);
        
        if (data.results && data.results.length > 0) {
          console.log(`\n📊 Collection Results:`);
          data.results.forEach((result: any, index: number) => {
            console.log(`   ${index + 1}. ${result.username}: ${result.success ? '✅' : '❌'}`);
            if (result.success) {
              console.log(`      Karma: ${result.karma}, Posts: ${result.postCount}`);
            } else {
              console.log(`      Error: ${result.error}`);
            }
          });
        }
      }
    } catch (parseError) {
      console.log(`❌ JSON Parse Error: ${(parseError as Error).message}`);
      console.log(`💡 This suggests the API returned HTML instead of JSON`);
      
      if (responseText.includes('<!doctype') || responseText.includes('<html')) {
        console.log(`🔍 Detected HTML response - likely a 404 or error page`);
      }
    }

  } catch (error) {
    console.log(`❌ Network Error: ${(error as Error).message}`);
    console.log(`💡 This could indicate:`);
    console.log(`   • Network connectivity issues`);
    console.log(`   • Server not responding`);
    console.log(`   • Cron endpoint not deployed`);
  }

  console.log('\n🔧 Debugging Tips:');
  console.log('================');
  console.log('1. Check if users are added to tracking first');
  console.log('2. Verify Reddit OAuth credentials are set in Vercel');
  console.log('3. Check Vercel function logs for detailed errors');
  console.log('4. Ensure the cron job route is deployed correctly');
  console.log('5. Test adding a user first: npm run test:add-user:vercel');
}

// Test POST method (simulating Vercel cron)
async function testCronJobPost() {
  console.log(`\n🕐 Testing Cron Job POST method (simulating Vercel cron)...\n`);

  try {
    const response = await fetch(`${CRON_BASE_URL}/api/cron/collect-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 POST Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      console.log(`✅ POST Response:`, JSON.stringify(data, null, 2));
    } catch {
      console.log(`📄 POST Raw Response: ${responseText.substring(0, 500)}`);
    }

  } catch (error) {
    console.log(`❌ POST Error: ${(error as Error).message}`);
  }
}

// Run both tests
async function runCronTests() {
  await testCronJob();
  await testCronJobPost();
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. If successful, the cron job will run automatically daily at 6 AM UTC');
  console.log('2. You can manually trigger it anytime by visiting the /api/cron/collect-data endpoint');
  console.log('3. Check Vercel dashboard → Functions → Cron for execution logs');
  console.log('4. Monitor your Supabase user_history table for collected data');
}

runCronTests().catch(error => {
  console.error('❌ Cron test failed:', error);
  process.exit(1);
});