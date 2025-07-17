/**
 * Test API endpoints to debug Vercel deployment issues
 * Run with: npx tsx scripts/test-api-endpoints.ts [BASE_URL]
 *
 * Examples:
 * npx tsx scripts/test-api-endpoints.ts http://localhost:3000
 * npx tsx scripts/test-api-endpoints.ts https://your-app.vercel.app
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";

interface TestResult {
  endpoint: string;
  method: string;
  status: "success" | "error";
  statusCode?: number;
  response?: any;
  error?: string;
}

async function testEndpoint(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<TestResult> {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      endpoint,
      method,
      status: response.ok ? "success" : "error",
      statusCode: response.status,
      response: data,
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: "error",
      error: (error as Error).message,
    };
  }
}

async function runTests() {
  console.log(`🧪 Testing API endpoints at: ${BASE_URL}\n`);

  const tests: Array<{
    endpoint: string;
    method: string;
    body?: any;
    description: string;
  }> = [
    {
      endpoint: "/api/health",
      method: "GET",
      description: "Health check endpoint",
    },
    {
      endpoint: "/api/users",
      method: "GET",
      description: "Get all tracked users",
    },
    {
      endpoint: "/api/users",
      method: "POST",
      body: { username: "spez" },
      description: "Add a test user (spez)",
    },
    {
      endpoint: "/api/reddit/user/spez",
      method: "GET",
      description: "Get Reddit user data for spez",
    },
    {
      endpoint: "/api/users/spez/history",
      method: "GET",
      description: "Get history for spez",
    },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.description}`);
    console.log(`   ${test.method} ${test.endpoint}`);

    const result = await testEndpoint(test.endpoint, test.method, test.body);
    results.push(result);

    if (result.status === "success") {
      console.log(`   ✅ Success (${result.statusCode})`);
      if (result.response) {
        console.log(
          `   📄 Response:`,
          JSON.stringify(result.response, null, 2).substring(0, 200) + "..."
        );
      }
    } else {
      console.log(`   ❌ Failed (${result.statusCode || "Network Error"})`);
      console.log(
        `   💥 Error:`,
        result.error || result.response?.error || "Unknown error"
      );
    }

    console.log("");

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log("📊 Test Summary:");
  console.log("================");

  const successful = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "error").length;

  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log("\n🔧 Failed endpoints:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => {
        console.log(
          `   • ${r.method} ${r.endpoint}: ${
            r.error || r.response?.error || "Unknown error"
          }`
        );
      });
  }

  console.log("\n💡 Debugging tips:");
  console.log("   • Check Vercel function logs for detailed error messages");
  console.log("   • Verify environment variables are set in Vercel dashboard");
  console.log("   • Ensure Supabase database is accessible from Vercel");
  console.log("   • Check if API routes are properly deployed");

  if (failed === 0) {
    console.log("\n🎉 All API endpoints are working correctly!");
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("❌ Test runner failed:", error);
  process.exit(1);
});
