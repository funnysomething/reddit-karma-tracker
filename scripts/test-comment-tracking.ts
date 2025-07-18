#!/usr/bin/env npx tsx

/**
 * Test script for comment tracking functionality
 * Tests Reddit API integration, database storage, and data retrieval
 */

import { fetchRedditUserDataOAuth } from '../src/lib/reddit-oauth';
import { UserHistoryRepository, TrackedUsersRepository } from '../src/lib/database';
import { validateCommentCount } from '../src/lib/database';

// Test configuration
const TEST_USERNAME = 'spez'; // Reddit CEO - should have lots of comment karma
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message: string, color: string = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function logError(message: string) {
  log(`❌ ${message}`, COLORS.RED);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, COLORS.BLUE);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, COLORS.YELLOW);
}

async function testRedditAPICommentFetching() {
  log(`\n${COLORS.BOLD}=== Testing Reddit API Comment Fetching ===${COLORS.RESET}`);
  
  try {
    logInfo(`Fetching Reddit data for user: ${TEST_USERNAME}`);
    const userData = await fetchRedditUserDataOAuth(TEST_USERNAME);
    
    logInfo('Reddit API Response:');
    console.log(JSON.stringify(userData, null, 2));
    
    // Validate the response structure
    if (!userData.username || !userData.karma || userData.post_count === undefined || userData.comment_count === undefined) {
      logError('Invalid response structure - missing required fields');
      return false;
    }
    
    // Check that comment_count is a valid number
    if (!validateCommentCount(userData.comment_count)) {
      logError(`Invalid comment count: ${userData.comment_count}`);
      return false;
    }
    
    logSuccess(`Successfully fetched comment data: ${userData.comment_count} comment karma`);
    logInfo(`Total karma: ${userData.karma} (posts: ${userData.post_count}, comments: ${userData.comment_count})`);
    
    return userData;
  } catch (error) {
    logError(`Failed to fetch Reddit data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testDatabaseStorage(userData: any) {
  log(`\n${COLORS.BOLD}=== Testing Database Storage ===${COLORS.RESET}`);
  
  try {
    logInfo('Storing user data in database...');
    const result = await UserHistoryRepository.create(
      userData.username,
      userData.karma,
      userData.post_count,
      userData.comment_count
    );
    
    if (!result.success) {
      logError(`Failed to store data: ${result.error}`);
      return false;
    }
    
    logSuccess('Successfully stored user data with comment tracking');
    logInfo('Stored data:');
    console.log(JSON.stringify(result.data, null, 2));
    
    // Verify the stored data includes comment_count
    if (result.data && result.data.comment_count !== userData.comment_count) {
      logError(`Comment count mismatch: expected ${userData.comment_count}, got ${result.data.comment_count}`);
      return false;
    }
    
    return result.data;
  } catch (error) {
    logError(`Database storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testDataRetrieval(username: string) {
  log(`\n${COLORS.BOLD}=== Testing Data Retrieval ===${COLORS.RESET}`);
  
  try {
    logInfo(`Retrieving history for user: ${username}`);
    const result = await UserHistoryRepository.getByUsername(username, 5);
    
    if (!result.success) {
      logError(`Failed to retrieve data: ${result.error}`);
      return false;
    }
    
    const historyData = result.data || [];
    logSuccess(`Retrieved ${historyData.length} history records`);
    
    // Check if any records have comment_count
    const recordsWithComments = historyData.filter(record => 
      record.comment_count !== undefined && record.comment_count !== null
    );
    
    if (recordsWithComments.length === 0) {
      logWarning('No records found with comment_count data');
      return false;
    }
    
    logSuccess(`Found ${recordsWithComments.length} records with comment tracking`);
    
    // Display the latest record
    const latestRecord = historyData[historyData.length - 1];
    if (latestRecord) {
      logInfo('Latest record:');
      console.log(JSON.stringify(latestRecord, null, 2));
    }
    
    return true;
  } catch (error) {
    logError(`Data retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testValidationFunctions() {
  log(`\n${COLORS.BOLD}=== Testing Validation Functions ===${COLORS.RESET}`);
  
  const testCases = [
    { value: 0, expected: true, description: 'Zero comment count' },
    { value: 100, expected: true, description: 'Positive comment count' },
    { value: -1, expected: false, description: 'Negative comment count' },
    { value: 1.5, expected: false, description: 'Decimal comment count' },
    { value: 'invalid', expected: false, description: 'String comment count' },
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    try {
      const result = validateCommentCount(testCase.value as number);
      if (result === testCase.expected) {
        logSuccess(`${testCase.description}: ${result}`);
        passed++;
      } else {
        logError(`${testCase.description}: expected ${testCase.expected}, got ${result}`);
      }
    } catch (error) {
      if (!testCase.expected) {
        logSuccess(`${testCase.description}: correctly threw error`);
        passed++;
      } else {
        logError(`${testCase.description}: unexpected error - ${error}`);
      }
    }
  }
  
  logInfo(`Validation tests: ${passed}/${total} passed`);
  return passed === total;
}

async function runCommentTrackingTests() {
  log(`${COLORS.BOLD}🧪 Reddit Karma Tracker - Comment Tracking Test Suite${COLORS.RESET}`);
  log(`${COLORS.BOLD}================================================================${COLORS.RESET}`);
  
  const results = {
    apiTest: false,
    storageTest: false,
    retrievalTest: false,
    validationTest: false
  };
  
  // Test 1: Reddit API Comment Fetching
  const userData = await testRedditAPICommentFetching();
  results.apiTest = !!userData;
  
  // Test 2: Database Storage (only if API test passed)
  if (userData) {
    const storedData = await testDatabaseStorage(userData);
    results.storageTest = !!storedData;
    
    // Test 3: Data Retrieval (only if storage test passed)
    if (storedData) {
      results.retrievalTest = await testDataRetrieval(userData.username);
    }
  }
  
  // Test 4: Validation Functions
  results.validationTest = await testValidationFunctions();
  
  // Summary
  log(`\n${COLORS.BOLD}=== Test Results Summary ===${COLORS.RESET}`);
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    log(`${status} ${testName}`);
  });
  
  log(`\n${COLORS.BOLD}Overall Result: ${passedTests}/${totalTests} tests passed${COLORS.RESET}`);
  
  if (passedTests === totalTests) {
    logSuccess('🎉 All comment tracking tests passed! Comment tracking is working correctly.');
  } else {
    logError('❌ Some tests failed. Please check the implementation.');
  }
  
  return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
  runCommentTrackingTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      logError(`Test suite failed with error: ${error}`);
      process.exit(1);
    });
}

export { runCommentTrackingTests };