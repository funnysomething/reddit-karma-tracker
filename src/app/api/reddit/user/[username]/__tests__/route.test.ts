import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { fetchRedditUserData } from '../../../../../../lib/reddit-api';
import { UserHistoryRepository } from '../../../../../../lib/database';

// Mock the dependencies
vi.mock('../../../../../../lib/reddit-api');
vi.mock('../../../../../../lib/database');

const mockFetchRedditUserData = vi.mocked(fetchRedditUserData);
const mockUserHistoryRepository = vi.mocked(UserHistoryRepository, true);

describe('/api/reddit/user/[username]', () => {
  const mockUsername = 'testuser';
  const mockRedditData = {
    username: mockUsername,
    karma: 1500,
    post_count: 25
  };
  
  const mockHistoryData = {
    id: '123',
    username: mockUsername,
    karma: 1500,
    post_count: 25,
    collected_at: '2024-01-01T12:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should successfully collect and store user data', async () => {
      // Arrange
      mockFetchRedditUserData.mockResolvedValue(mockRedditData);
      mockUserHistoryRepository.create.mockResolvedValue({
        success: true,
        data: mockHistoryData
      });

      const request = new NextRequest('http://localhost/api/reddit/user/testuser', {
        method: 'POST'
      });

      // Act
      const response = await POST(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRedditData);
      expect(mockFetchRedditUserData).toHaveBeenCalledWith(mockUsername);
      expect(mockUserHistoryRepository.create).toHaveBeenCalledWith(
        mockRedditData.username,
        mockRedditData.karma,
        mockRedditData.post_count
      );
    });

    it('should return 400 for missing username parameter', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/reddit/user/', {
        method: 'POST'
      });

      // Act
      const response = await POST(request, { params: { username: '' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username parameter is required');
    });

    it('should return 400 for invalid username format', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/reddit/user/ab', {
        method: 'POST'
      });

      // Act
      const response = await POST(request, { params: { username: 'ab' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid username format. Username must be 3-20 characters, alphanumeric and underscores only');
    });

    it('should return 404 for user not found', async () => {
      // Arrange
      mockFetchRedditUserData.mockRejectedValue(new Error('User testuser not found or data unavailable'));

      const request = new NextRequest('http://localhost/api/reddit/user/testuser', {
        method: 'POST'
      });

      // Act
      const response = await POST(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Reddit user not found, deleted, or suspended');
    });

    it('should return 429 for rate limit exceeded', async () => {
      // Arrange
      mockFetchRedditUserData.mockRejectedValue(new Error('Rate limit exceeded'));

      const request = new NextRequest('http://localhost/api/reddit/user/testuser', {
        method: 'POST'
      });

      // Act
      const response = await POST(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Reddit API rate limit exceeded. Please try again later.');
    });

    it('should return 500 for database storage failure', async () => {
      // Arrange
      mockFetchRedditUserData.mockResolvedValue(mockRedditData);
      mockUserHistoryRepository.create.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const request = new NextRequest('http://localhost/api/reddit/user/testuser', {
        method: 'POST'
      });

      // Act
      const response = await POST(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to store user data in database');
    });

    it('should return 503 for general Reddit API failure', async () => {
      // Arrange
      mockFetchRedditUserData.mockRejectedValue(new Error('Network timeout'));

      const request = new NextRequest('http://localhost/api/reddit/user/testuser', {
        method: 'POST'
      });

      // Act
      const response = await POST(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unable to fetch Reddit user data. Please try again later.');
    });
  });

  describe('GET', () => {
    it('should successfully fetch user data without storing', async () => {
      // Arrange
      mockFetchRedditUserData.mockResolvedValue(mockRedditData);

      const request = new NextRequest('http://localhost/api/reddit/user/testuser', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRedditData);
      expect(mockFetchRedditUserData).toHaveBeenCalledWith(mockUsername);
      expect(mockUserHistoryRepository.create).not.toHaveBeenCalled();
    });

    it('should return 400 for missing username parameter', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/reddit/user/', {
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

    it('should return 404 for user not found', async () => {
      // Arrange
      mockFetchRedditUserData.mockRejectedValue(new Error('User testuser not found or data unavailable'));

      const request = new NextRequest('http://localhost/api/reddit/user/testuser', {
        method: 'GET'
      });

      // Act
      const response = await GET(request, { params: { username: mockUsername } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Reddit user not found, deleted, or suspended');
    });
  });
});