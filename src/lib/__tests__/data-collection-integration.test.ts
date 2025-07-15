import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataCollectionService } from '../data-collection';
import { fetchRedditUserData } from '../reddit-api';
import { TrackedUsersRepository, UserHistoryRepository } from '../database';
import { DataCollectionLogger } from '../logging';
import { RedditUserData, TrackedUser, HistoryData } from '../types';

// Mock the dependencies
vi.mock('../reddit-api');
vi.mock('../database');
vi.mock('../logging');

const mockFetchRedditUserData = vi.mocked(fetchRedditUserData);
const mockTrackedUsersRepository = vi.mocked(TrackedUsersRepository, true);
const mockUserHistoryRepository = vi.mocked(UserHistoryRepository, true);
const mockDataCollectionLogger = vi.mocked(DataCollectionLogger, true);

describe('Data Collection Integration Tests', () => {
  const mockTrackedUsers: TrackedUser[] = [
    {
      id: '1',
      username: 'user1',
      created_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    {
      id: '2',
      username: 'user2',
      created_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    {
      id: '3',
      username: 'user3',
      created_at: '2024-01-01T00:00:00Z',
      is_active: true
    }
  ];

  const mockRedditData: Record<string, RedditUserData> = {
    user1: { username: 'user1', karma: 1000, post_count: 20 },
    user2: { username: 'user2', karma: 2000, post_count: 30 },
    user3: { username: 'user3', karma: 1500, post_count: 25 }
  };

  const mockHistoryData: Record<string, HistoryData> = {
    user1: {
      id: '1',
      username: 'user1',
      karma: 1000,
      post_count: 20,
      collected_at: '2024-01-01T12:00:00Z'
    },
    user2: {
      id: '2',
      username: 'user2',
      karma: 2000,
      post_count: 30,
      collected_at: '2024-01-01T12:00:00Z'
    },
    user3: {
      id: '3',
      username: 'user3',
      karma: 1500,
      post_count: 25,
      collected_at: '2024-01-01T12:00:00Z'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock logger methods
    mockDataCollectionLogger.logCollectionStart.mockReturnValue({
      startTime: '2024-01-01T12:00:00Z',
      totalUsers: 0,
      successfulCollections: 0,
      failedCollections: 0,
      skippedCollections: 0,
      errors: []
    });
    
    mockDataCollectionLogger.logCollectionEnd.mockReturnValue({
      startTime: '2024-01-01T12:00:00Z',
      endTime: '2024-01-01T12:01:00Z',
      duration: 60000,
      totalUsers: 0,
      successfulCollections: 0,
      failedCollections: 0,
      skippedCollections: 0,
      errors: []
    });
  });

  describe('Successful batch collection', () => {
    it('should successfully collect data for all users', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: mockTrackedUsers
      });

      // Mock userNeedsCollection to return true for all users
      vi.spyOn(DataCollectionService, 'userNeedsCollection').mockResolvedValue(true);

      // Mock successful Reddit API calls
      mockFetchRedditUserData
        .mockResolvedValueOnce(mockRedditData.user1)
        .mockResolvedValueOnce(mockRedditData.user2)
        .mockResolvedValueOnce(mockRedditData.user3);

      // Mock successful database storage
      mockUserHistoryRepository.create
        .mockResolvedValueOnce({ success: true, data: mockHistoryData.user1 })
        .mockResolvedValueOnce({ success: true, data: mockHistoryData.user2 })
        .mockResolvedValueOnce({ success: true, data: mockHistoryData.user3 });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(3);
      expect(result.data?.successfulCollections).toBe(3);
      expect(result.data?.failedCollections).toBe(0);
      expect(result.data?.errors).toHaveLength(0);

      // Verify logging calls
      expect(mockDataCollectionLogger.logCollectionStart).toHaveBeenCalledWith(3);
      expect(mockDataCollectionLogger.logCollectionEnd).toHaveBeenCalled();
      expect(mockDataCollectionLogger.logUserSuccess).toHaveBeenCalledTimes(3);
      expect(mockDataCollectionLogger.logBatchStart).toHaveBeenCalled();
      expect(mockDataCollectionLogger.logBatchEnd).toHaveBeenCalled();
    });

    it('should skip users that do not need collection', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: mockTrackedUsers
      });

      // Mock userNeedsCollection to return false for user2
      vi.spyOn(DataCollectionService, 'userNeedsCollection')
        .mockResolvedValueOnce(true)   // user1
        .mockResolvedValueOnce(false)  // user2 - skip
        .mockResolvedValueOnce(true);  // user3

      // Mock successful Reddit API calls for user1 and user3 only
      mockFetchRedditUserData
        .mockResolvedValueOnce(mockRedditData.user1)
        .mockResolvedValueOnce(mockRedditData.user3);

      // Mock successful database storage
      mockUserHistoryRepository.create
        .mockResolvedValueOnce({ success: true, data: mockHistoryData.user1 })
        .mockResolvedValueOnce({ success: true, data: mockHistoryData.user3 });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(3);
      expect(result.data?.successfulCollections).toBe(2);
      expect(result.data?.failedCollections).toBe(0);
      expect(result.data?.errors).toHaveLength(0);

      // Verify logging calls
      expect(mockDataCollectionLogger.logUserSkip).toHaveBeenCalledWith('user2', 'data collected recently');
      expect(mockDataCollectionLogger.logUserSuccess).toHaveBeenCalledTimes(2);
    });
  });

  describe('Partial failure scenarios', () => {
    it('should handle mixed success and failure results', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: mockTrackedUsers
      });

      vi.spyOn(DataCollectionService, 'userNeedsCollection').mockResolvedValue(true);

      // Mock Reddit API calls - user2 fails
      mockFetchRedditUserData
        .mockResolvedValueOnce(mockRedditData.user1)
        .mockRejectedValueOnce(new Error('User user2 not found'))
        .mockResolvedValueOnce(mockRedditData.user3);

      // Mock database storage - user1 and user3 succeed
      mockUserHistoryRepository.create
        .mockResolvedValueOnce({ success: true, data: mockHistoryData.user1 })
        .mockResolvedValueOnce({ success: true, data: mockHistoryData.user3 });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(3);
      expect(result.data?.successfulCollections).toBe(2);
      expect(result.data?.failedCollections).toBe(1);
      expect(result.data?.errors).toHaveLength(1);
      expect(result.data?.errors[0].username).toBe('user2');
      expect(result.data?.errors[0].error).toContain('not found');

      // Verify logging calls
      expect(mockDataCollectionLogger.logUserSuccess).toHaveBeenCalledTimes(2);
      expect(mockDataCollectionLogger.logUserFailure).toHaveBeenCalledTimes(1);
    });

    it('should handle database storage failures', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: [mockTrackedUsers[0]] // Only test with one user
      });

      vi.spyOn(DataCollectionService, 'userNeedsCollection').mockResolvedValue(true);

      // Mock successful Reddit API call
      mockFetchRedditUserData.mockResolvedValue(mockRedditData.user1);

      // Mock database storage failure
      mockUserHistoryRepository.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(1);
      expect(result.data?.successfulCollections).toBe(0);
      expect(result.data?.failedCollections).toBe(1);
      expect(result.data?.errors).toHaveLength(1);
      expect(result.data?.errors[0].error).toContain('Database connection failed');

      // Verify logging calls
      expect(mockDataCollectionLogger.logUserFailure).toHaveBeenCalledWith(
        'user1',
        expect.stringContaining('Database connection failed'),
        expect.any(String),
        expect.any(Boolean)
      );
    });
  });

  describe('Complete failure scenarios', () => {
    it('should handle failure to fetch tracked users', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch tracked users');

      // Verify logging calls
      expect(mockDataCollectionLogger.error).toHaveBeenCalledWith(
        'Failed to fetch tracked users',
        { error: 'Database connection failed' }
      );
    });

    it('should handle unexpected errors during collection', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockRejectedValue(new Error('Unexpected database error'));

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to collect data for all users');

      // Verify logging calls
      expect(mockDataCollectionLogger.error).toHaveBeenCalledWith(
        'Batch data collection failed',
        { error: 'Unexpected database error' },
        expect.any(Error)
      );
    });
  });

  describe('Empty user list scenarios', () => {
    it('should handle empty user list gracefully', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(0);
      expect(result.data?.successfulCollections).toBe(0);
      expect(result.data?.failedCollections).toBe(0);
      expect(result.data?.errors).toHaveLength(0);

      // Verify logging calls
      expect(mockDataCollectionLogger.info).toHaveBeenCalledWith('No users to track for data collection');
      expect(mockDataCollectionLogger.logCollectionStart).toHaveBeenCalledWith(0);
      expect(mockDataCollectionLogger.logCollectionEnd).toHaveBeenCalled();
    });
  });

  describe('Batch processing behavior', () => {
    it('should process users in batches with proper delays', async () => {
      // Arrange - Create 7 users to test batching (batch size is 5)
      const manyUsers = Array.from({ length: 7 }, (_, i) => ({
        id: `${i + 1}`,
        username: `user${i + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        is_active: true
      }));

      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: manyUsers
      });

      vi.spyOn(DataCollectionService, 'userNeedsCollection').mockResolvedValue(true);

      // Mock all Reddit API calls to succeed
      manyUsers.forEach((user, index) => {
        mockFetchRedditUserData.mockResolvedValueOnce({
          username: user.username,
          karma: 1000 + index * 100,
          post_count: 20 + index * 5
        });
      });

      // Mock all database storage to succeed
      manyUsers.forEach((user, index) => {
        mockUserHistoryRepository.create.mockResolvedValueOnce({
          success: true,
          data: {
            id: `${index + 1}`,
            username: user.username,
            karma: 1000 + index * 100,
            post_count: 20 + index * 5,
            collected_at: '2024-01-01T12:00:00Z'
          }
        });
      });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(7);
      expect(result.data?.successfulCollections).toBe(7);
      expect(result.data?.failedCollections).toBe(0);

      // Verify batch logging - should have 2 batches (5 + 2 users)
      expect(mockDataCollectionLogger.logBatchStart).toHaveBeenCalledTimes(2);
      expect(mockDataCollectionLogger.logBatchEnd).toHaveBeenCalledTimes(2);
      
      // Verify rate limiting delay was logged (between batches)
      expect(mockDataCollectionLogger.logRateLimit).toHaveBeenCalledWith(2000, 'batch processing delay');
    });
  });
});