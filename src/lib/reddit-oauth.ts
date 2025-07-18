/**
 * Reddit OAuth API Client
 * Uses OAuth 2.0 with client credentials flow for server-to-server authentication
 */

import { RedditUserData } from "./types";

interface RedditOAuthConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
}

interface RedditAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class RedditOAuthClient {
  private config: RedditOAuthConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: RedditOAuthConfig) {
    this.config = config;
  }

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log("Requesting new Reddit OAuth access token...");

    try {
      // Create basic auth header
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString("base64");

      const response = await fetch(
        "https://www.reddit.com/api/v1/access_token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": this.config.userAgent,
          },
          body: "grant_type=client_credentials",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OAuth token request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const tokenData: RedditAccessToken = await response.json();

      this.accessToken = tokenData.access_token;
      // Set expiry to 90% of actual expiry to ensure we refresh before it expires
      this.tokenExpiry = Date.now() + tokenData.expires_in * 1000 * 0.9;

      console.log(
        `Reddit OAuth token obtained, expires in ${tokenData.expires_in} seconds`
      );
      return this.accessToken;
    } catch (error) {
      console.error("Failed to get Reddit OAuth token:", error);
      throw new Error(
        `Reddit OAuth authentication failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fetch Reddit user data using OAuth API
   */
  async fetchUserData(username: string): Promise<RedditUserData> {
    try {
      const accessToken = await this.getAccessToken();

      console.log(`Fetching Reddit user data for: ${username}`);

      const response = await fetch(
        `https://oauth.reddit.com/user/${username}/about`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": this.config.userAgent,
            Accept: "application/json",
          },
        }
      );

      console.log(`Reddit OAuth API response status: ${response.status}`);

      if (response.status === 404) {
        throw new Error(`User ${username} not found`);
      }

      if (response.status === 403) {
        throw new Error(`User ${username} account is suspended or private`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Reddit API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error(`Invalid response format for user ${username}`);
      }

      const userData = data.data;

      // Validate required fields
      if (
        typeof userData.link_karma !== "number" ||
        typeof userData.comment_karma !== "number"
      ) {
        throw new Error(`Invalid user data structure for ${username}`);
      }

      return {
        username: userData.name,
        karma: userData.link_karma + userData.comment_karma,
        post_count: userData.link_karma, // Using link_karma as post count approximation
        comment_count: userData.comment_karma, // Using comment_karma as comment count
      };
    } catch (error) {
      console.error(`Error fetching Reddit user data for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Check if a Reddit user exists
   */
  async userExists(username: string): Promise<boolean> {
    try {
      await this.fetchUserData(username);
      return true;
    } catch (error) {
      if ((error as Error).message.includes("not found")) {
        return false;
      }
      // For other errors (suspended, private, etc.), we'll assume the user exists
      console.warn(
        `User existence check failed for ${username}, assuming exists:`,
        (error as Error).message
      );
      return true;
    }
  }

  /**
   * Get current token status for debugging
   */
  getTokenStatus(): { hasToken: boolean; expiresIn: number } {
    return {
      hasToken: !!this.accessToken,
      expiresIn: Math.max(0, this.tokenExpiry - Date.now()) / 1000,
    };
  }
}

// Singleton OAuth client instance for token reuse
let defaultClient: RedditOAuthClient | null = null;

function getDefaultClient(): RedditOAuthClient {
  if (!defaultClient) {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const userAgent = process.env.REDDIT_USER_AGENT || "RedditKarmaTracker/1.0";

    if (!clientId || !clientSecret) {
      throw new Error(
        "Reddit OAuth credentials not configured. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables."
      );
    }

    defaultClient = new RedditOAuthClient({
      clientId,
      clientSecret,
      userAgent,
    });
  }
  return defaultClient;
}

// Utility functions using singleton client for token reuse
export async function fetchRedditUserDataOAuth(
  username: string
): Promise<RedditUserData> {
  return getDefaultClient().fetchUserData(username);
}

export async function validateRedditUsernameOAuth(
  username: string
): Promise<boolean> {
  return getDefaultClient().userExists(username);
}
