import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { RedditApiClient, fetchRedditUserData, validateRedditUsername } from '../reddit-api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('RedditApiClient', () => {
  let client: RedditApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAxiosInstance = {
      get: vi.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Create client with minimal retry for faster tests
    client = new RedditApiClient({
      userAgent: 'TestAgent/1.0',
      rateLimit: {
        maxRequests: 10,
        windowMs: 1000,
        retryAfterMs: 10
      },
      retry: {
        maxRetries: 1,
        baseDelayMs: 10,
        maxDelayMs: 50
      }
    });
  });

  describe('fetchUserData', () => {
    it('should fetch user data successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            name: 'testuser',
            link_karma: 100,
            comment_karma: 200
          }
        }
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.fetchUserData('testuser');
      
      expect(result).toEqual({
        username: 'testuser',
        karma: 300,
        post_count: 100
      });
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/testuser/about.json');
    });

    it('should throw error for non-existent user', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Request failed with status code 404'
      });
      
      await expect(client.fetchUserData('nonexistentuser')).rejects.toThrow();
    });

    it('should throw error when response data is missing', async () => {
      const mockResponse = {
        data: null
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      
      await expect(client.fetchUserData('testuser')).rejects.toThrow(
        'User testuser not found or data unavailable'
      );
    });
  });

  describe('userExists', () => {
    it('should return true for existing user', async () => {
      const mockResponse = {
        data: {
          data: {
            name: 'testuser',
            link_karma: 100,
            comment_karma: 200
          }
        }
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.userExists('testuser');
      expect(result).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Request failed with status code 404'
      });
      
      const result = await client.userExists('nonexistentuser');
      expect(result).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should track rate limit status', () => {
      const status = client.getRateLimitStatus();
      expect(status).toHaveProperty('requestsInWindow');
      expect(status).toHaveProperty('maxRequests');
      expect(typeof status.requestsInWindow).toBe('number');
      expect(typeof status.maxRequests).toBe('number');
    });
  });

  describe('retry logic', () => {
    it('should not retry on user not found errors', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Request failed with status code 404'
      });
      
      await expect(client.fetchUserData('nonexistentuser')).rejects.toThrow();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Core functionality tests', () => {
  it('should create RedditApiClient with default configuration', () => {
    const client = new RedditApiClient();
    expect(client).toBeDefined();
    
    const status = client.getRateLimitStatus();
    expect(status.maxRequests).toBeGreaterThan(0);
  });

  it('should create RedditApiClient with custom configuration', () => {
    const client = new RedditApiClient({
      userAgent: 'CustomAgent/1.0',
      rateLimit: {
        maxRequests: 30,
        windowMs: 60000,
        retryAfterMs: 2000
      },
      retry: {
        maxRetries: 5,
        baseDelayMs: 2000,
        maxDelayMs: 30000
      }
    });
    
    expect(client).toBeDefined();
    const status = client.getRateLimitStatus();
    expect(status.maxRequests).toBe(30);
  });
});

describe('Error handling edge cases', () => {
  let client: RedditApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAxiosInstance = {
      get: vi.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    client = new RedditApiClient({
      retry: {
        maxRetries: 1,
        baseDelayMs: 10,
        maxDelayMs: 50
      }
    });
  });

  it('should handle suspended user accounts', async () => {
    mockAxiosInstance.get.mockRejectedValueOnce({
      response: { status: 403 },
      message: 'Forbidden'
    });
    
    const result = await client.userExists('suspendeduser');
    expect(result).toBe(false);
  });

  it('should handle malformed JSON responses', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: 'invalid json'
    });
    
    await expect(client.fetchUserData('testuser')).rejects.toThrow();
  });
});