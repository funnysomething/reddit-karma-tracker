import { NextRequest, NextResponse } from "next/server";
import {
  TrackedUsersRepository,
  UserHistoryRepository,
} from "../../../../lib/database";
import { fetchRedditUserDataOAuth } from "../../../../lib/reddit-oauth";
import { DataCollectionLogger } from "../../../../lib/logging";

interface CollectionResult {
  username: string;
  success: boolean;
  error?: string;
  karma?: number;
  postCount?: number;
}

interface CollectionSummary {
  message: string;
  totalUsers: number;
  collected: number;
  errors: number;
  results: CollectionResult[];
  timestamp: string;
}

async function performDataCollection(): Promise<CollectionSummary> {
  DataCollectionLogger.info("Starting automated data collection");

  // Get all tracked users
  const usersResult = await TrackedUsersRepository.getAll();

  if (!usersResult.success) {
    DataCollectionLogger.error("Failed to fetch tracked users", {
      error: usersResult.error,
    });
    throw new Error(`Failed to fetch tracked users: ${usersResult.error}`);
  }

  const users = usersResult.data || [];

  if (users.length === 0) {
    DataCollectionLogger.info("No users to collect data for");
    return {
      message: "No users to collect data for",
      totalUsers: 0,
      collected: 0,
      errors: 0,
      results: [],
      timestamp: new Date().toISOString(),
    };
  }

  DataCollectionLogger.info(
    `Starting data collection for ${users.length} users`
  );

  const results: CollectionResult[] = [];
  let collected = 0;
  let errors = 0;

  // Process users in batches to avoid overwhelming Reddit API
  const batchSize = 3; // Reduced batch size for OAuth API
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    // Process batch concurrently but with controlled concurrency
    const batchPromises = batch.map(async (user) => {
      try {
        DataCollectionLogger.info(`Collecting data for user: ${user.username}`);

        // Fetch current Reddit data using OAuth
        const redditData = await fetchRedditUserDataOAuth(user.username);

        // Store in history
        const historyResult = await UserHistoryRepository.create(
          user.username,
          redditData.karma,
          redditData.post_count
        );

        if (!historyResult.success) {
          throw new Error(`Failed to store history: ${historyResult.error}`);
        }

        // Update user's last updated timestamp
        const updateResult = await TrackedUsersRepository.updateLastUpdated(
          user.username
        );

        if (!updateResult.success) {
          DataCollectionLogger.warn(
            `Failed to update last_updated for ${user.username}`,
            {
              error: updateResult.error,
            }
          );
        }

        collected++;
        const result: CollectionResult = {
          username: user.username,
          success: true,
          karma: redditData.karma,
          postCount: redditData.post_count,
        };
        results.push(result);

        DataCollectionLogger.info(
          `Successfully collected data for ${user.username}`,
          {
            karma: redditData.karma,
            postCount: redditData.post_count,
          }
        );

        return result;
      } catch (error) {
        errors++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        const result: CollectionResult = {
          username: user.username,
          success: false,
          error: errorMessage,
        };
        results.push(result);

        DataCollectionLogger.error(
          `Failed to collect data for ${user.username}`,
          {
            error: errorMessage,
            username: user.username,
          }
        );

        return result;
      }
    });

    // Wait for current batch to complete
    await Promise.all(batchPromises);

    // Add delay between batches to respect rate limits
    if (i + batchSize < users.length) {
      DataCollectionLogger.info(
        `Completed batch ${
          Math.floor(i / batchSize) + 1
        }, waiting before next batch...`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay between batches
    }
  }

  DataCollectionLogger.info("Automated data collection completed", {
    totalUsers: users.length,
    successful: collected,
    failed: errors,
  });

  return {
    message: "Data collection completed",
    totalUsers: users.length,
    collected,
    errors,
    results,
    timestamp: new Date().toISOString(),
  };
}

// POST method for Vercel Cron
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<CollectionSummary | { error: string; details?: string }>
> {
  try {
    // Verify the request is from Vercel Cron (optional security check)
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      DataCollectionLogger.warn("Unauthorized cron request attempt", {
        ip: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Reddit OAuth credentials are configured
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      DataCollectionLogger.error("Reddit OAuth credentials not configured");
      return NextResponse.json(
        {
          error: "Reddit OAuth credentials not configured",
          details:
            "Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables",
        },
        { status: 500 }
      );
    }

    const result = await performDataCollection();
    return NextResponse.json(result);
  } catch (error) {
    DataCollectionLogger.error("Automated data collection failed", { error });
    return NextResponse.json(
      {
        error: "Internal server error during data collection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET method for manual testing and debugging
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<CollectionSummary | { error: string; details?: string }>
> {
  try {
    // Optional: Add basic auth for manual testing
    const url = new URL(request.url);
    const testMode = url.searchParams.get("test");

    if (testMode === "true") {
      DataCollectionLogger.info("Manual data collection test initiated");
    }

    // Check if Reddit OAuth credentials are configured
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      DataCollectionLogger.error("Reddit OAuth credentials not configured");
      return NextResponse.json(
        {
          error: "Reddit OAuth credentials not configured",
          details:
            "Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables",
        },
        { status: 500 }
      );
    }

    const result = await performDataCollection();
    return NextResponse.json(result);
  } catch (error) {
    DataCollectionLogger.error("Manual data collection failed", { error });
    return NextResponse.json(
      {
        error: "Internal server error during data collection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
