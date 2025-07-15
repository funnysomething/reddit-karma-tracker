import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { UserHistoryRepository, TrackedUsersRepository } from '../../../../../../lib/database';

// Mock the dependencies
vi.mock('../../../../../../lib/database');

const mockUserHistoryRepository = vi.mocked(UserHistoryRepository, true);
const mockTrackedUsersRepository = vi.mocked(TrackedUsersRepository, true);

describe('/api/users/[username]/history', () => {
  const mockUsername = 'testuser';
  const mockHistoryData = [
    {
      id: '1',
      username: mockUsername,
      karma: 1000,
      post_count: 20,
      collected_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '2',
      username: mockUsername,
      karma: 1500,
      post_count: 25,
      collected_at: '2024-01-02T12:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should successfully fetch user history data', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: true,
        data: mockHistoryData
      });

      const request = new NextRequest('http://localhost/api/users/testuser/history', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockHistoryData);
      expect(mockTrackedUsersRepository.exists).toHaveBeenCalledWith(mockUsername);
      expect(mockUserHistoryRepository.getByUsername).toHaveBeenCalledWith(mockUsername, undefined);
    });

    it('should fetch user history data with limit parameter', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: true,
        data: [mockHistoryData[0]]
      });

      const request = new NextRequest('http://localhost/api/users/testuser/history?limit=1', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockHistoryData[0]]);
      expect(mockUserHistoryRepository.getByUsername).toHaveBeenCalledWith(mockUsername, 1);
    });

    it('should fetch user history data with date range parameters', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);
      mockUserHistoryRepository.getHistoryForDateRange.mockResolvedValue({
        success: true,
        data: mockHistoryData
      });

      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-03T00:00:00.000Z';
      const request = new NextRequest(
        `http://localhost/api/users/testuser/history?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
      );

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockHistoryData);
      expect(mockUserHistoryRepository.getHistoryForDateRange).toHaveBeenCalledWith(
        mockUsername,
        new Date(startDate),
        new Date(endDate)
      );
    });

    it('should return 400 for missing username parameter', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/users//history', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: '' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username parameter is required');
    });

    it('should return 400 for invalid username format', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/users/ab/history', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: 'ab' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid username format. Username must be 3-20 characters, alphanumeric and underscores only');
    });

    it('should return 404 for user not being tracked', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/users/testuser/history', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User is not currently being tracked');
    });

    it('should return 400 for invalid limit parameter', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/users/testuser/history?limit=invalid', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Limit parameter must be a positive integer');
    });

    it('should return 400 for negative limit parameter', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/users/testuser/history?limit=-1', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Limit parameter must be a positive integer');
    });

    it('should return 400 for incomplete date range parameters', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/users/testuser/history?startDate=2024-01-01T00:00:00.000Z', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Both startDate and endDate parameters are required for date range queries');
    });

    it('should return 400 for invalid date format', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost/api/users/testuser/history?startDate=invalid-date&endDate=2024-01-03T00:00:00.000Z',
        { method: 'GET' }
      );

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)');
    });

    it('should return 400 for start date after end date', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost/api/users/testuser/history?startDate=2024-01-03T00:00:00.000Z&endDate=2024-01-01T00:00:00.000Z',
        { method: 'GET' }
      );

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Start date must be before end date');
    });

    it('should return 500 for database error', async () => {
      // Arrange
      mockTrackedUsersRepository.exists.mockResolvedValue(true);
      mockUserHistoryRepository.getByUsername.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const request = new NextRequest('http://localhost/api/users/testuser/history', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch user history data');
    });
  });
});