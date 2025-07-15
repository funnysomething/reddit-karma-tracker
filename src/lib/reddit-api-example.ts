/**
 * Example usage of Reddit API utilities
 * This file demonstrates how to use the Reddit API client
 */

import { RedditApiClient, fetchRedditUserData, validateRedditUsername } from './reddit-api';

// Example 1: Using the default client
export async function exampleBasicUsage() {
  try {
    // Validate a username exists
    const userExists = await validateRedditUsername('spez');
    console.log('User exists:', userExists);
    
    if (userExists) {
      // Fetch user data
      const userData = await fetchRedditUserData('spez');
      console.log('User data:', userData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 2: Using a custom client with specific configuration
export async function exampleCustomClient() {
  const client = new RedditApiClient({
    userAgent: 'MyApp/1.0',
    rateLimit: {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
      retryAfterMs: 2000
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000
    }
  });

  try {
    const userData = await client.fetchUserData('reddit');
    console.log('Reddit user data:', userData);
    
    // Check rate limit status
    const rateLimitStatus = client.getRateLimitStatus();
    console.log('Rate limit status:', rateLimitStatus);
  } catch (error) {
    console.error('Error with custom client:', error);
  }
}

// Example 3: Batch processing multiple users
export async function exampleBatchProcessing(usernames: string[]) {
  const client = new RedditApiClient();
  const results = [];

  for (const username of usernames) {
    try {
      const userData = await client.fetchUserData(username);
      results.push({ username, success: true, data: userData });
    } catch (error) {
      results.push({ 
        username, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return results;
}

// Example 4: Error handling patterns
export async function exampleErrorHandling(username: string) {
  const client = new RedditApiClient();

  try {
    const userData = await client.fetchUserData(username);
    return { success: true, data: userData };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { success: false, error: 'USER_NOT_FOUND' };
      } else if (error.message.includes('failed after')) {
        return { success: false, error: 'NETWORK_ERROR' };
      } else {
        return { success: false, error: 'UNKNOWN_ERROR', details: error.message };
      }
    }
    return { success: false, error: 'UNEXPECTED_ERROR' };
  }
}