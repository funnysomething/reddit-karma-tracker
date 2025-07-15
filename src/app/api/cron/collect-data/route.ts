import { NextRequest, NextResponse } from 'next/server';
import { TrackedUsersRepository, UserHistoryRepository } from '@/lib/database';
import { fetchRedditUserData } from '@/lib/reddit-api';
import { DataCollectionLogger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional security check)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      DataCollectionLogger.warn('Unauthorized cron request attempt', { 
        ip: request.ip,
        userAgent: request.headers.get('user-agent') 
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    DataCollectionLogger.info('Starting automated data collection');

    // Get all tracked users
    const usersResult = await TrackedUsersRepository.getAll();
    
    if (!usersResult.success) {
      DataCollectionLogger.error('Failed to fetch tracked users', { error: usersResult.error });
      return NextResponse.json({ 
        error: 'Failed to fetch tracked users',
        details: usersResult.error
      }, { status: 500 });
    }

    const users = usersResult.data;
    
    if (users.length === 0) {
      DataCollectionLogger.info('No users to collect data for');
      return NextResponse.json({ 
        message: 'No users to collect data for',
        collected: 0,
        errors: 0
      });
    }

    DataCollectionLogger.info(`Starting data collection for ${users.length} users`);

    const results = {
      collected: 0,
      errors: 0,
      userResults: [] as Array<{
        username: string;
        success: boolean;
        error?: string;
        karma?: number;
        postCount?: number;
      }>
    };

    // Process users in batches to avoid overwhelming Reddit API
    const batchSize = 5;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      // Process batch concurrently but with controlled concurrency
      const batchPromises = batch.map(async (user) => {
        try {
          DataCollectionLogger.info(`Collecting data for user: ${user.username}`);
          
          // Fetch current Reddit data
          const redditData = await fetchRedditUserData(user.username);
          
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
          const updateResult = await TrackedUsersRepository.updateLastUpdated(user.username);
          
          if (!updateResult.success) {
            DataCollectionLogger.warn(`Failed to update last_updated for ${user.username}`, { 
              error: updateResult.error 
            });
          }

          results.collected++;
          results.userResults.push({
            username: user.username,
            success: true,
            karma: redditData.karma,
            postCount: redditData.post_count
          });

          DataCollectionLogger.info(`Successfully collected data for ${user.username}`, {
            karma: redditData.karma,
            postCount: redditData.post_count
          });

        } catch (error) {
          results.errors++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          results.userResults.push({
            username: user.username,
            success: false,
            error: errorMessage
          });

          DataCollectionLogger.error(`Failed to collect data for ${user.username}`, {
            error: errorMessage,
            username: user.username
          });
        }
      });

      // Wait for current batch to complete
      await Promise.all(batchPromises);

      // Add delay between batches to respect rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    DataCollectionLogger.info('Automated data collection completed', {
      totalUsers: users.length,
      successful: results.collected,
      failed: results.errors
    });

    return NextResponse.json({
      message: 'Data collection completed',
      totalUsers: users.length,
      collected: results.collected,
      errors: results.errors,
      results: results.userResults
    });

  } catch (error) {
    DataCollectionLogger.error('Automated data collection failed', { error });
    return NextResponse.json({
      error: 'Internal server error during data collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}