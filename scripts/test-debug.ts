/**
 * Debug test to check environment variables and Reddit API on Vercel
 * Run with: npx tsx scripts/test-debug.ts [BASE_URL]
 */

const DEBUG_BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testDebugEndpoints() {
  console.log(`🔍 Testing Debug Endpoints at: ${DEBUG_BASE_URL}\n`);

  // Test environment variables
  console.log('1️⃣ Testing Environment Variables...');
  try {
    const response = await fetch(`${DEBUG_BASE_URL}/api/debug/env`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Environment: ${data.environment}`);
    console.log(`   Has Supabase URL: ${data.hasSupabaseUrl}`);
    console.log(`   Has Supabase Key: ${data.hasSupabaseKey}`);
    console.log(`   Has Reddit User Agent: ${data.hasRedditUserAgent}`);
    console.log(`   Reddit User Agent: ${data.redditUserAgent}`);
    console.log(`   Supabase URL Length: ${data.supabaseUrlLength}`);
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
    console.log('');
  }

  // Test Reddit OAuth API
  console.log('2️⃣ Testing Reddit OAuth API...');
  try {
    const response = await fetch(`${DEBUG_BASE_URL}/api/debug/oauth`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    
    if (data.success) {
      console.log(`   ✅ Reddit OAuth Working!`);
      console.log(`   Test User: ${data.testResult?.username}`);
      console.log(`   User Data:`, data.testResult?.data);
      console.log(`   Token Status:`, data.tokenStatus);
    } else {
      console.log(`   ❌ Reddit OAuth Failed: ${data.error}`);
      console.log(`   Config:`, data.config);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
    console.log('');
  }

  // Test the actual user addition with a known good user
  console.log('3️⃣ Testing User Addition (spez)...');
  try {
    const response = await fetch(`${DEBUG_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'spez' }),
    });
    
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    
    if (data.success) {
      console.log(`   ✅ User added successfully!`);
      console.log(`   User ID: ${data.data?.id}`);
    } else {
      console.log(`   ❌ Failed: ${data.error}`);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
    console.log('');
  }

  console.log('🔧 Debug Summary:');
  console.log('================');
  console.log('If environment variables are missing, add them in Vercel dashboard');
  console.log('If Reddit API fails, check User-Agent format and network access');
  console.log('If user addition fails, check both environment and Reddit API');
}

// Run the debug tests
async function runDebugTests() {
  await testDebugEndpoints();
}

runDebugTests().catch(error => {
  console.error('❌ Debug test failed:', error);
  process.exit(1);
});