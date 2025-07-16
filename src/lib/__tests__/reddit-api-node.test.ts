/**
 * Node.js Integration Tests for Reddit API
 * These tests run in Node.js environment (not jsdom) to allow real HTTP requests
 * Run with: npm run test:node or vitest run --environment=node reddit-api-node
 */

import { describe, it, expect } from 'vitest';
import { RedditApiClient, fetchRedditUserData, validateRedditUsername } from '../reddit-api';

// Integration tests that actually call the Reddit API
// These tests run in Node.js environment to allow real HTTP requests
describe('Reddit API Node Integration Tests', () => {
  const client = new RedditApiClient({
    userAgent: 'RedditKarmaTracker/1.0 (Node Integration Test)',
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

  describe('Real Reddit API Calls', () => {
    it('should fetch real user data for u/funnysomething', async () => {
      console.log('Testing Reddit API call for u/funnysomething...');
      
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
      
      console.log('✅ Successfully fetched user data for u/funnysomething:', userData);
    }, 20000); // 20 second timeout for API call

    it('should validate that u/funnysomething exists', async () => {
      console.log('Testing user existence validation for u/funnysomething...');
      
      const exists = await client.userExists('funnysomething');
      expect(exists).toBe(true);
      
      console.log('✅ User u/funnysomething exists:', exists);
    }, 15000);

    it('should handle non-existent user gracefully', async () => {
      console.log('Testing non-existent user handling...');
      
      const nonExistentUser = 'thisuserdoesnotexist12345xyz';
      
      await expect(client.fetchUserData(nonExistentUser)).rejects.toThrow();
      
      console.log('✅ Non-existent user handled correctly');
    }, 15000);

    it('should validate that non-existent user does not exist', async () => {
      console.log('Testing non-existent user validation...');
      
      const exists = await client.userExists('thisuserdoesnotexist12345xyz');
      expect(exists).toBe(false);
      
      console.log('✅ Non-existent user validation:', exists);
    }, 15000);
  });

  describe('Utility Functions', () => {
    it('should fetch user data using utility function', async () => {
      console.log('Testing utility function fetchRedditUserData...');
      
      const userData = await fetchRedditUserData('funnysomething');
      
      expect(userData.username).toBe('funnysomething');
      expect(typeof userData.karma).toBe('number');
      expect(typeof userData.post_count).toBe('number');
      
      console.log('✅ Utility function result:', userData);
    }, 20000);

    it('should validate username using utility function', async () => {
      console.log('Testing utility function validateRedditUsername...');
      
      const isValid = await validateRedditUsername('funnysomething');
      expect(isValid).toBe(true);
      
      console.log('✅ Username validation result:', isValid);
    }, 15000);
  });

  describe('Rate Limiting', () => {
    it('should track rate limit status during real calls', async () => {
      console.log('Testing rate limiting...');
      
      const initialStatus = client.getRateLimitStatus();
      console.log('Initial rate limit status:', initialStatus);
      
      await client.fetchUserData('funnysomething');
      
      const afterCallStatus = client.getRateLimitStatus();
      console.log('After API call rate limit status:', afterCallStatus);
      
      expect(afterCallStatus.requestsInWindow).toBeGreaterThan(initialStatus.requestsInWindow);
      
      console.log('✅ Rate limiting working correctly');
    }, 20000);
  });

  describe('API Response Structure', () => {
    it('should verify Reddit API response structure matches expectations', async () => {
      console.log('Testing API response structure...');
      
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
      
      console.log('✅ API response structure validated successfully');
    }, 25000);
  });

  describe('Error Handling', () => {
    it('should handle various error scenarios appropriately', async () => {
      console.log('Testing error handling...');
      
      // Test with a username that might be suspended or deleted
      try {
        await client.fetchUserData('deleted');
        console.log('⚠️  User "deleted" unexpectedly exists');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('✅ Expected error for deleted user:', (error as Error).message);
      }
    }, 15000);
  });
});