import axios, { AxiosInstance, AxiosError } from 'axios';
import { RedditUserData } from './types';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs: number;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

// Reddit API client configuration
interface RedditApiConfig {
  userAgent: string;
  rateLimit: RateLimitConfig;
  retry: RetryConfig;
}

// Rate limiter class to track API calls
class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    );

    // If we've hit the rate limit, wait
    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.config.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.requests.push(now);
  }
}

// Reddit API client class
export class RedditApiClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private config: RedditApiConfig;

  constructor(config?: Partial<RedditApiConfig>) {
    this.config = {
      userAgent: config?.userAgent || 'RedditKarmaTracker/1.0',
      rateLimit: {
        maxRequests: 60,
        windowMs: 60 * 1000, // 1 minute
        retryAfterMs: 1000,
        ...config?.rateLimit
      },
      retry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        ...config?.retry
      }
    };

    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    
    this.client = axios.create({
      baseURL: 'https://www.reddit.com',
      timeout: 10000,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Fetch user data from Reddit API with rate limiting and retry logic
   */
  async fetchUserData(username: string): Promise<RedditUserData> {
    return this.executeWithRetry(async () => {
      await this.rateLimiter.waitIfNeeded();
      
      const response = await this.client.get(`/user/${username}/about.json`);
      
      if (!response.data || !response.data.data) {
        throw new Error(`User ${username} not found or data unavailable`);
      }

      const userData = response.data.data;
      
      // Validate response structure
      if (typeof userData.link_karma !== 'number' || 
          typeof userData.comment_karma !== 'number') {
        throw new Error(`Invalid user data structure for ${username}`);
      }

      return {
        username: userData.name,
        karma: userData.link_karma + userData.comment_karma,
        post_count: userData.link_karma // Using link_karma as post count approximation
      };
    });
  }

  /**
   * Check if a Reddit user exists
   */
  async userExists(username: string): Promise<boolean> {
    try {
      await this.fetchUserData(username);
      return true;
    } catch (error) {
      if (this.isUserNotFoundError(error)) {
        return false;
      }
      // Re-throw other errors (network issues, etc.)
      throw error;
    }
  }

  /**
   * Execute a function with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.retry.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on user not found errors
        if (this.isUserNotFoundError(error)) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.config.retry.maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.retry.baseDelayMs * Math.pow(2, attempt),
          this.config.retry.maxDelayMs
        );
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        console.warn(
          `Reddit API request failed (attempt ${attempt + 1}/${this.config.retry.maxRetries + 1}), retrying in ${Math.round(jitteredDelay)}ms:`,
          error instanceof Error ? error.message : error
        );
        
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }
    
    throw new Error(
      `Reddit API request failed after ${this.config.retry.maxRetries + 1} attempts: ${lastError.message}`
    );
  }

  /**
   * Check if an error indicates a user was not found
   */
  private isUserNotFoundError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      return error.response?.status === 404 || 
             error.response?.status === 403 ||
             error.message.includes('not found');
    }
    
    if (error instanceof Error) {
      return error.message.includes('not found') ||
             error.message.includes('unavailable');
    }
    
    // Handle plain objects with response property (for mocked errors)
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const errorObj = error as { response?: { status?: number } };
      return errorObj.response?.status === 404 || errorObj.response?.status === 403;
    }
    
    return false;
  }

  /**
   * Get rate limiter status for monitoring
   */
  getRateLimitStatus(): { requestsInWindow: number; maxRequests: number } {
    const now = Date.now();
    const requestsInWindow = this.rateLimiter['requests'].filter(
      timestamp => now - timestamp < this.config.rateLimit.windowMs
    ).length;
    
    return {
      requestsInWindow,
      maxRequests: this.config.rateLimit.maxRequests
    };
  }
}

// Default client instance
export const redditApi = new RedditApiClient();

// Utility functions for easier usage
export async function fetchRedditUserData(username: string): Promise<RedditUserData> {
  return redditApi.fetchUserData(username);
}

export async function validateRedditUsername(username: string): Promise<boolean> {
  return redditApi.userExists(username);
}