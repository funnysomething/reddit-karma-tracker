import { fetchRedditUserData } from './reddit-api';
import { TrackedUsersRepository, UserHistoryRepository } from './database';
import { HistoryData, ApiResponse } from './types';
import { classifyRedditError, getUserFriendlyErrorMessage } from './error-handling';
import { DataCollectionLogger, CollectionMetrics } from './logging';

// Data collection service for Reddit user data
export class DataCollectionService {
  /**
   * Collect and store data for a single user
   */
  static async collectUserData(username: string): Promise<ApiResponse<HistoryData>> {
    try {
      // Fetch current Reddit user data
      const redditUserData = await fetchRedditUserData(username);
      
      // Store the data in the database with timestamp
      const storeResult = await UserHistoryRepository.create(
        redditUserData.username,
        redditUserData.karma,
        redditUserData.post_count
      );

      if (!storeResult.success) {
        return {
          success: false,
          error: `Failed to store data for user ${username}: ${storeResult.error}`
        };
      }

      return {
        success: true,
        data: storeResult.data
      };
    } catch (error) {
      // Use enhanced error classification
      const classifiedError = classifyRedditError(error, username);
      const userFriendlyMessage = getUserFriendlyErrorMessage(classifiedError);
      
      // Log detailed error for debugging
      console.error(`Data collection failed for user ${username}:`, {
        type: classifiedError.type,
        message: classifiedError.message,
        retryable: classifiedError.retryable,
        originalError: error
      });
      
      return {
        success: false,
        error: userFriendlyMessage
      };
    }
  }

  /**
   * Collect and store data for all tracked users with enhanced batch processing and logging
   */
  static async collectAllUsersData(): Promise<ApiResponse<CollectionSummary>> {
    let metrics: CollectionMetrics | null = null;
    
    try {
      // Get all tracked users
      const usersResult = await TrackedUsersRepository.getAll();
      
      if (!usersResult.success) {
        DataCollectionLogger.error('Failed to fetch tracked users', { error: usersResult.error });
        return {
          success: false,
          error: `Failed to fetch tracked users: ${usersResult.error}`
        };
      }

      const trackedUsers = usersResult.data || [];
      
      // Initialize metrics and logging
      metrics = DataCollectionLogger.logCollectionStart(trackedUsers.length);
      
      const summary: CollectionSummary = {
        totalUsers: trackedUsers.length,
        successfulCollections: 0,
        failedCollections: 0,
        errors: [],
        collectedAt: metrics.startTime
      };

      // If no users to track, return early
      if (trackedUsers.length === 0) {
        DataCollectionLogger.info('No users to track for data collection');
        DataCollectionLogger.logCollectionEnd(metrics);
        return {
          success: true,
          data: summary
        };
      }

      DataCollectionLogger.info(`Starting batch data collection for ${trackedUsers.length} users`);

      // Process users in batches to avoid overwhelming the Reddit API
      const batchSize = 5; // Process 5 users at a time
      const batches = [];
      
      for (let i = 0; i < trackedUsers.length; i += batchSize) {
        batches.push(trackedUsers.slice(i, i + batchSize));
      }

      // Process each batch sequentially with delay between batches
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        DataCollectionLogger.logBatchStart(batchIndex, batches.length, batch.length);

        let batchSuccessful = 0;
        let batchFailed = 0;

        // Process users in current batch concurrently
        const batchPromises = batch.map(async (user) => {
          try {
            // Check if user needs collection (avoid unnecessary API calls)
            const needsCollection = await this.userNeedsCollection(user.username);
            
            if (!needsCollection) {
              DataCollectionLogger.logUserSkip(user.username, 'data collected recently');
              metrics!.skippedCollections++;
              return { success: true, skipped: true };
            }

            const result = await this.collectUserData(user.username);
            
            if (result.success) {
              summary.successfulCollections++;
              metrics!.successfulCollections++;
              batchSuccessful++;
              DataCollectionLogger.logUserSuccess(user.username, {
                karma: result.data?.karma,
                postCount: result.data?.post_count
              });
            } else {
              summary.failedCollections++;
              metrics!.failedCollections++;
              batchFailed++;
              
              // Classify error for better logging
              const classifiedError = classifyRedditError(new Error(result.error || 'Unknown error'), user.username);
              
              const errorEntry = {
                username: user.username,
                error: result.error || 'Unknown error',
                errorType: classifiedError.type,
                retryable: classifiedError.retryable
              };
              
              summary.errors.push(errorEntry);
              metrics!.errors.push(errorEntry);
              
              DataCollectionLogger.logUserFailure(
                user.username, 
                result.error || 'Unknown error',
                classifiedError.type,
                classifiedError.retryable
              );
            }
            
            return result;
          } catch (error) {
            summary.failedCollections++;
            metrics!.failedCollections++;
            batchFailed++;
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const classifiedError = classifyRedditError(error, user.username);
            
            const errorEntry = {
              username: user.username,
              error: errorMessage,
              errorType: classifiedError.type,
              retryable: classifiedError.retryable
            };
            
            summary.errors.push(errorEntry);
            metrics!.errors.push(errorEntry);
            
            DataCollectionLogger.logUserFailure(
              user.username,
              errorMessage,
              classifiedError.type,
              classifiedError.retryable
            );
            
            return {
              success: false,
              error: errorMessage
            };
          }
        });

        // Wait for current batch to complete
        await Promise.all(batchPromises);
        
        DataCollectionLogger.logBatchEnd(batchIndex, batches.length, batchSuccessful, batchFailed);

        // Add delay between batches to respect rate limits (except for last batch)
        if (batchIndex < batches.length - 1) {
          const delayMs = 2000; // 2 second delay between batches
          DataCollectionLogger.logRateLimit(delayMs, 'batch processing delay');
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      // Log final metrics
      DataCollectionLogger.logCollectionEnd(metrics);
      
      DataCollectionLogger.info(`Batch data collection completed`, {
        successful: summary.successfulCollections,
        failed: summary.failedCollections,
        skipped: metrics.skippedCollections,
        total: summary.totalUsers
      });

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      DataCollectionLogger.error('Batch data collection failed', { error: errorMessage }, error as Error);
      
      if (metrics) {
        DataCollectionLogger.logCollectionEnd(metrics);
      }
      
      return {
        success: false,
        error: `Failed to collect data for all users: ${errorMessage}`
      };
    }
  }

  /**
   * Collect data for multiple specific users
   */
  static async collectUsersData(usernames: string[]): Promise<ApiResponse<CollectionSummary>> {
    try {
      const summary: CollectionSummary = {
        totalUsers: usernames.length,
        successfulCollections: 0,
        failedCollections: 0,
        errors: [],
        collectedAt: new Date().toISOString()
      };

      // Collect data for each user
      const collectionPromises = usernames.map(async (username) => {
        try {
          const result = await this.collectUserData(username);
          
          if (result.success) {
            summary.successfulCollections++;
          } else {
            summary.failedCollections++;
            summary.errors.push({
              username,
              error: result.error || 'Unknown error'
            });
          }
          
          return result;
        } catch (error) {
          summary.failedCollections++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          summary.errors.push({
            username,
            error: errorMessage
          });
          
          return {
            success: false,
            error: errorMessage
          };
        }
      });

      // Wait for all collections to complete
      await Promise.all(collectionPromises);

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to collect data for specified users: ${errorMessage}`
      };
    }
  }

  /**
   * Get the latest collected data for a user
   */
  static async getLatestUserData(username: string): Promise<ApiResponse<HistoryData | null>> {
    try {
      const result = await UserHistoryRepository.getByUsername(username, 1);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      const latestData = (result.data && result.data.length > 0) ? result.data[result.data.length - 1] : null;
      
      return {
        success: true,
        data: latestData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to get latest data for user ${username}: ${errorMessage}`
      };
    }
  }

  /**
   * Check if a user needs data collection (no data collected in the last 24 hours)
   */
  static async userNeedsCollection(username: string): Promise<boolean> {
    try {
      const latestDataResult = await this.getLatestUserData(username);
      
      if (!latestDataResult.success || !latestDataResult.data) {
        // No data exists, needs collection
        return true;
      }

      const latestCollectionTime = new Date(latestDataResult.data.collected_at);
      const now = new Date();
      const hoursSinceLastCollection = (now.getTime() - latestCollectionTime.getTime()) / (1000 * 60 * 60);

      // Needs collection if more than 24 hours have passed
      return hoursSinceLastCollection >= 24;
    } catch (error) {
      console.error(`Error checking collection status for ${username}:`, error);
      // If we can't determine, assume it needs collection
      return true;
    }
  }
}

// Types for collection summary
export interface CollectionSummary {
  totalUsers: number;
  successfulCollections: number;
  failedCollections: number;
  errors: CollectionError[];
  collectedAt: string;
}

export interface CollectionError {
  username: string;
  error: string;
}

// Utility functions for data collection
export async function collectSingleUserData(username: string): Promise<ApiResponse<HistoryData>> {
  return DataCollectionService.collectUserData(username);
}

export async function collectAllTrackedUsersData(): Promise<ApiResponse<CollectionSummary>> {
  return DataCollectionService.collectAllUsersData();
}

export async function collectSpecificUsersData(usernames: string[]): Promise<ApiResponse<CollectionSummary>> {
  return DataCollectionService.collectUsersData(usernames);
}