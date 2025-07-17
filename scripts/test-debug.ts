/**
 * Debug test to check environment variables and Reddit API on Vercel
 * Run with: npx tsx scripts/test-debug.ts [BASE_URL]
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testDebugEndpoints() {
  console.log(`🔍 Testing Debug Endpoints at: ${BASE_URL}\n`);

  // Test environment variables
  console.log('1️⃣ Testing Environment Variables...');
  try {
    const response = await fetch(`${BASE_URL}/api/debug/env`);
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

  // Test Reddit API directly
  console.log('2️⃣ Testing Reddit API Direct Call...');
  try {
    const response = await fetch(`${BASE_URL}/api/debug/reddit`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   User Agent: ${data.userAgent}`);
    
    if (data.success) {
      console.log(`   ✅ Reddit API Working!`);
      console.log(`   Reddit Response Status: ${data.redditResponse?.status}`);
      console.log(`   Has Data: ${data.redditResponse?.hasData}`);
      console.log(`   Username: ${data.redditResponse?.username}`);
      console.log(`   Karma: ${data.redditResponse?.karma}`);
    } else {
      console.log(`   ❌ Reddit API Failed: ${data.error}`);
      if (data.responseHeaders) {
        console.log(`   Response Headers:`, data.responseHeaders);
      }
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
    console.log('');
  }

  // Test the actual user addition with a known good user
  console.log('3️⃣ Testing User Addition (spez)...');
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
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

testDebugEndpoints().catch(error => {
  console.error('❌ Debug test failed:', error);
  process.exit(1);
});