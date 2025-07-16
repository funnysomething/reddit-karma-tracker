import { describe, it, expect } from 'vitest';
import { RedditApiClient, fetchRedditUserData, validateRedditUsername } from '../reddit-api';

// Integration tests that actually call the Reddit API
// These tests are marked as integration tests and may be slower
describe('Reddit API Integration Tests', () => {
  const client = new RedditApiClient({
    userAgent: 'RedditKarmaTracker/1.0 (Integration Test)',
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
      retryAfterMs: 1000
    },
    retry: {
      maxRetries: 2,
      baseDelayMs: 1000,
      maxDelayMs: 5000
    }
  });

  describe('fetchUserData - Real API Calls', () => {
    it('should fetch real user data for u/funnysomething', async () => {
      const userData = await client.fetchUserData('funnysomething');
      
      // Verify the structure of returned data
      expect(userData).toHaveProperty('username');
      expect(userData).toHaveProperty('karma');
      expect(userData).toHaveProperty('post_count');
      
      // Verify data types
      expect(typeof userData.username).toBe('string');
      expect(typeof userData.karma).toBe('number');
      expect(typeof userData.post_count).toBe('number');
      
      // Verify the username matches what we requested
      expect(userData.username).toBe('funnysomething');
      
      // Karma should be a non-negative number
      expect(userData.karma).toBeGreaterThanOrEqual(0);
      expect(userData.post_count).toBeGreaterThanOrEqual(0);
      
      console.log('User data for u/funnysomething:', userData);
    }, 15000); // 15 second timeout for API call

    it('should handle non-existent user gracefully', async () => {
      const nonExistentUser = 'thisuserdoesnotexist12345xyz';
      
      await expect(client.fetchUserData(nonExistentUser)).rejects.toThrow();
    }, 10000);

    it('should validate that u/funnysomething exists', async () => {
      const exists = await client.userExists('funnysomething');
      expect(exists).toBe(true);
    }, 10000);

    it('should validate that non-existent user does not exist', async () => {
      const exists = await client.userExists('thisuserdoesnotexist12345xyz');
      expect(exists).toBe(false);
    }, 10000);
  });

  describe('Utility Functions - Real API Calls', () => {
    it('should fetch user data using utility function', async () => {
      const userData = await fetchRedditUserData('funnysomething');
      
      expect(userData.username).toBe('funnysomething');
      expect(typeof userData.karma).toBe('number');
      expect(typeof userData.post_count).toBe('number');
      
      console.log('Utility function result:', userData);
    }, 15000);

    it('should validate username using utility function', async () => {
      const isValid = await validateRedditUsername('funnysomething');
      expect(isValid).toBe(true);
    }, 10000);
  });

  describe('Rate Limiting - Real API Calls', () => {
    it('should track rate limit status during real calls', async () => {
      const initialStatus = client.getRateLimitStatus();
      console.log('Initial rate limit status:', initialStatus);
      
      await client.fetchUserData('funnysomething');
      
      const afterCallStatus = client.getRateLimitStatus();
      console.log('After API call rate limit status:', afterCallStatus);
      
      expect(afterCallStatus.requestsInWindow).toBeGreaterThan(initialStatus.requestsInWindow);
    }, 15000);
  });

  describe('Error Handling - Real API Calls', () => {
    it('should handle Reddit API errors appropriately', async () => {
      // Test with a username that might be suspended or deleted
      try {
        await client.fetchUserData('deleted');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Expected error for deleted user:', (error as Error).message);
      }
    }, 10000);
  });
});

// Additional test to verify the API response structure matches our expectations
describe('Reddit API Response Structure Validation', () => {
  it('should verify Reddit API response structure for u/funnysomething', async () => {
    const client = new RedditApiClient({
      userAgent: 'RedditKarmaTracker/1.0 (Structure Test)'
    });
    
    try {
      const userData = await client.fetchUserData('funnysomething');
      
      // Log the actual structure for debugging
      console.log('Complete user data structure:', JSON.stringify(userData, null, 2));
      
      // Verify all required fields are present
      const requiredFields = ['username', 'karma', 'post_count'];
      requiredFields.forEach(field => {
        expect(userData).toHaveProperty(field);
        expect(userData[field as keyof typeof userData]).toBeDefined();
      });
      
      // Verify field types
      expect(typeof userData.username).toBe('string');
      expect(typeof userData.karma).toBe('number');
      expect(typeof userData.post_count).toBe('number');
      
      // Verify reasonable values
      expect(userData.username.length).toBeGreaterThan(0);
      expect(userData.karma).toBeGreaterThanOrEqual(0);
      expect(userData.post_count).toBeGreaterThanOrEqual(0);
      
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, 20000); // Longer timeout for this comprehensive test
});