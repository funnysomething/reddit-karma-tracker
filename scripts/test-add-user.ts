/**
 * Simple test to add user "funnysomething" to tracking
 * Run with: npx tsx scripts/test-add-user.ts [BASE_URL]
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testAddUser() {
  console.log(`🧪 Testing Add User API at: ${BASE_URL}\n`);

  const testUser = 'funnysomething';
  
  try {
    console.log(`📤 Attempting to add user: ${testUser}`);
    console.log(`   URL: ${BASE_URL}/api/users`);
    console.log(`   Method: POST`);
    console.log(`   Body: { "username": "${testUser}" }`);
    console.log('');

    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: testUser }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    // Try to get response as text first to see what we're actually getting
    const responseText = await response.text();
    console.log(`📄 Raw Response (first 500 chars):`);
    console.log(responseText.substring(0, 500));
    console.log('');

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log(`✅ Parsed JSON Response:`);
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log(`🎉 SUCCESS: User ${testUser} added successfully!`);
        console.log(`   User ID: ${data.data?.id}`);
        console.log(`   Created: ${data.data?.created_at}`);
      } else {
        console.log(`❌ API Error: ${data.error}`);
      }
    } catch (parseError) {
      console.log(`❌ JSON Parse Error: ${(parseError as Error).message}`);
      console.log(`💡 This suggests the API returned HTML instead of JSON`);
      
      // Check if it's an HTML error page
      if (responseText.includes('<!doctype') || responseText.includes('<html')) {
        console.log(`🔍 Detected HTML response - likely a 404 or error page`);
        
        // Extract title if possible
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
          console.log(`   Page Title: ${titleMatch[1]}`);
        }
      }
    }

  } catch (error) {
    console.log(`❌ Network Error: ${(error as Error).message}`);
    console.log(`💡 This could indicate:`);
    console.log(`   • Network connectivity issues`);
    console.log(`   • CORS problems`);
    console.log(`   • Server not responding`);
  }

  console.log('\n🔧 Debugging Tips:');
  console.log('================');
  console.log('1. Check if the API route exists in Vercel Functions dashboard');
  console.log('2. Verify environment variables are set in Vercel');
  console.log('3. Check Vercel function logs for detailed errors');
  console.log('4. Ensure the project root directory is set correctly');
  console.log('5. Try accessing the API route directly in browser');
}

// Also test a simple GET request to see if any API routes work
async function testGetUsers() {
  console.log(`\n🔍 Testing GET /api/users to see if any API routes work...\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`);
    const responseText = await response.text();
    
    console.log(`📊 GET Response Status: ${response.status} ${response.statusText}`);
    console.log(`📄 GET Response (first 200 chars): ${responseText.substring(0, 200)}`);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(responseText);
        console.log(`✅ GET request successful - API routes are working!`);
        console.log(`   Current tracked users: ${data.data?.length || 0}`);
      } catch {
        console.log(`❌ GET returned 200 but not valid JSON`);
      }
    } else {
      console.log(`❌ GET request failed - API routes may not be deployed`);
    }
  } catch (error) {
    console.log(`❌ GET request error: ${(error as Error).message}`);
  }
}

// Run both tests
async function runTests() {
  await testGetUsers();
  await testAddUser();
}

runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});