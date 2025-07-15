import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataCollectionService, collectSingleUserData, collectAllTrackedUsersData } from '../data-collection';
import { fetchRedditUserData } from '../reddit-api';
import { TrackedUsersRepository, UserHistoryRepository } from '../database';
import { RedditUserData, TrackedUser, HistoryData } from '../types';

// Mock the dependencies
vi.mock('../reddit-api');
vi.mock('../database');

const mockFetchRedditUserData = vi.mocked(fetchRedditUserData);
const mockTrackedUsersRepository = vi.mocked(TrackedUsersRepository, true);
const mockUserHistoryRepository = vi.mocked(UserHistoryRepository, true);

describe('DataCollectionService', () => {
  const mockUsername = 'testuser';
  const mockRedditData: RedditUserData = {
    username: mockUsername,
    karma: 1500,
    post_count: 25
  };
  
  const mockHistoryData: HistoryData = {
    id: '123',
    username: mockUsername,
    karma: 1500,
    post_count: 25,
    collected_at: '2024-01-01T12:00:00Z'
  };

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
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('collectUserData', () => {
    it('should successfully collect and store user data', async () => {
      // Arrange
      mockFetchRedditUserData.mockResolvedValue(mockRedditData);
      mockUserHistoryRepository.create.mockResolvedValue({
        success: true,
        data: mockHistoryData
      });

      // Act
      const result = await DataCollectionService.collectUserData(mockUsername);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistoryData);
      expect(mockFetchRedditUserData).toHaveBeenCalledWith(mockUsername);
      expect(mockUserHistoryRepository.create).toHaveBeenCalledWith(
        mockRedditData.username,
        mockRedditData.karma,
        mockRedditData.post_count
      );
    });

    it('should handle Reddit API user not found error', async () => {
      // Arrange
      mockFetchRedditUserData.mockRejectedValue(new Error('User testuser not found or data unavailable'));

      // Act
      const result = await DataCollectionService.collectUserData(mockUsername);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockUserHistoryRepository.create).not.toHaveBeenCalled();
    });

    it('should handle Reddit API rate limit error', async () => {
      // Arrange
      mockFetchRedditUserData.mockRejectedValue(new Error('Rate limit exceeded'));

      // Act
      const result = await DataCollectionService.collectUserData(mockUsername);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
      expect(mockUserHistoryRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database storage failure', async () => {
      // Arrange
      mockFetchRedditUserData.mockResolvedValue(mockRedditData);
      mockUserHistoryRepository.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      // Act
      const result = await DataCollectionService.collectUserData(mockUsername);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to store data');
      expect(mockFetchRedditUserData).toHaveBeenCalledWith(mockUsername);
    });
  });

  describe('collectAllUsersData', () => {
    it('should successfully collect data for all tracked users', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: mockTrackedUsers
      });
      
      mockFetchRedditUserData
        .mockResolvedValueOnce({ username: 'user1', karma: 1000, post_count: 20 })
        .mockResolvedValueOnce({ username: 'user2', karma: 2000, post_count: 30 });
      
      mockUserHistoryRepository.create
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockHistoryData, username: 'user1', karma: 1000, post_count: 20 }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockHistoryData, username: 'user2', karma: 2000, post_count: 30 }
        });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(2);
      expect(result.data?.successfulCollections).toBe(2);
      expect(result.data?.failedCollections).toBe(0);
      expect(result.data?.errors).toHaveLength(0);
      expect(mockTrackedUsersRepository.getAll).toHaveBeenCalled();
      expect(mockFetchRedditUserData).toHaveBeenCalledTimes(2);
      expect(mockUserHistoryRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures when collecting data for all users', async () => {
      // Arrange
      mockTrackedUsersRepository.getAll.mockResolvedValue({
        success: true,
        data: mockTrackedUsers
      });
      
      mockFetchRedditUserData
        .mockResolvedValueOnce({ username: 'user1', karma: 1000, post_count: 20 })
        .mockRejectedValueOnce(new Error('User user2 not found'));
      
      mockUserHistoryRepository.create.mockResolvedValueOnce({
        success: true,
        data: { ...mockHistoryData, username: 'user1', karma: 1000, post_count: 20 }
      });

      // Act
      const result = await DataCollectionService.collectAllUsersData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(2);
      expect(result.data?.successfulCollections).toBe(1);
      expect(result.data?.failedCollections).toBe(1);
      expect(result.data?.errors).toHaveLength(1);
      expect(result.data?.errors[0].username).toBe('user2');
    });

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
      expect(mockFetchRedditUserData).not.toHaveBeenCalled();
    });
  });

  describe('getLatestUserData', () => {
    it('should successfully get latest user data', async () => {
      // Arrange
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: true,
        data: [mockHistoryData]
      });

      // Act
      const result = await DataCollectionService.getLatestUserData(mockUsername);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistoryData);
      expect(mockUserHistoryRepository.getByUsername).toHaveBeenCalledWith(mockUsername, 1);
    });

    it('should return null when no data exists', async () => {
      // Arrange
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      const result = await DataCollectionService.getLatestUserData(mockUsername);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle database error', async () => {
      // Arrange
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      // Act
      const result = await DataCollectionService.getLatestUserData(mockUsername);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('userNeedsCollection', () => {
    it('should return true when no data exists', async () => {
      // Arrange
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      const result = await DataCollectionService.userNeedsCollection(mockUsername);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when data is older than 24 hours', async () => {
      // Arrange
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago
      
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: true,
        data: [{
          ...mockHistoryData,
          collected_at: oldDate.toISOString()
        }]
      });

      // Act
      const result = await DataCollectionService.userNeedsCollection(mockUsername);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when data is recent (less than 24 hours)', async () => {
      // Arrange
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago
      
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: true,
        data: [{
          ...mockHistoryData,
          collected_at: recentDate.toISOString()
        }]
      });

      // Act
      const result = await DataCollectionService.userNeedsCollection(mockUsername);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when database error occurs', async () => {
      // Arrange
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      // Act
      const result = await DataCollectionService.userNeedsCollection(mockUsername);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('utility functions', () => {
    it('collectSingleUserData should call DataCollectionService.collectUserData', async () => {
      // Arrange
      const spy = vi.spyOn(DataCollectionService, 'collectUserData');
      spy.mockResolvedValue({ success: true, data: mockHistoryData });

      // Act
      const result = await collectSingleUserData(mockUsername);

      // Assert
      expect(spy).toHaveBeenCalledWith(mockUsername);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistoryData);
    });

    it('collectAllTrackedUsersData should call DataCollectionService.collectAllUsersData', async () => {
      // Arrange
      const spy = vi.spyOn(DataCollectionService, 'collectAllUsersData');
      const mockSummary = {
        totalUsers: 1,
        successfulCollections: 1,
        failedCollections: 0,
        errors: [],
        collectedAt: '2024-01-01T12:00:00Z'
      };
      spy.mockResolvedValue({ success: true, data: mockSummary });

      // Act
      const result = await collectAllTrackedUsersData();

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
    });
  });
});