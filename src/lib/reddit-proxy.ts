/**
 * Reddit API Proxy - Alternative approach when direct calls are blocked
 */

import { RedditUserData } from "./types";

// Alternative Reddit API endpoints that might work better from Vercel
const REDDIT_ENDPOINTS = [
  "https://www.reddit.com/user/{username}/about.json",
  "https://old.reddit.com/user/{username}/about.json",
  "https://api.reddit.com/user/{username}/about",
];

export async function fetchRedditUserWithProxy(
  username: string
): Promise<RedditUserData> {
  const userAgent = process.env.REDDIT_USER_AGENT || "RedditKarmaTracker/1.0";

  // Try different endpoints
  for (const endpoint of REDDIT_ENDPOINTS) {
    const url = endpoint.replace("{username}", username);

    try {
      console.log(`Trying Reddit endpoint: ${url}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      console.log(`Response status: ${response.status} for ${url}`);

      if (response.status === 200) {
        const data = await response.json();

        if (data && data.data) {
          const userData = data.data;

          return {
            username: userData.name,
            karma: (userData.link_karma || 0) + (userData.comment_karma || 0),
            post_count: userData.link_karma || 0,
          };
        }
      }

      if (response.status === 403) {
        console.log(`403 Blocked for ${url}, trying next endpoint...`);
        continue;
      }

      if (response.status === 404) {
        throw new Error(`User ${username} not found`);
      }
    } catch (error) {
      console.log(`Error with ${url}:`, (error as Error).message);
      continue;
    }
  }

  // If all endpoints fail, throw error
  throw new Error(
    `Unable to fetch Reddit user data for ${username}. All endpoints blocked or failed.`
  );
}

export async function validateRedditUserWithProxy(
  username: string
): Promise<boolean> {
  try {
    await fetchRedditUserWithProxy(username);
    return true;
  } catch (error) {
    if ((error as Error).message.includes("not found")) {
      return false;
    }
    
    // For blocking errors, we'll assume the user exists if the username format is valid
    // This is a temporary workaround for Vercel IP blocking
    console.warn(
      `Reddit validation failed for ${username} due to IP blocking, assuming user exists:`,
      (error as Error).message
    );
    
    // Basic username validation - if it looks like a valid Reddit username, assume it exists
    if (username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)) {
      console.log(`Username ${username} passes basic validation, assuming it exists`);
      return true;
    }
    
    return false;
  }
}

// Fallback function that creates mock data when Reddit API is completely blocked
export async function createMockRedditData(username: string): Promise<RedditUserData> {
  console.warn(`Creating mock data for ${username} due to Reddit API blocking`);
  
  return {
    username: username,
    karma: 1, // Start with minimal karma
    post_count: 1, // Start with minimal post count
  };
}
