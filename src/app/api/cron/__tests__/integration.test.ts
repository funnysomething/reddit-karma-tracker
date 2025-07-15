import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../collect-data/route';

// Mock the entire flow with realistic data
vi.mock('@/lib/database', () => ({
  TrackedUsersRepository: {
    getAll: vi.fn(),
    updateLastUpdated: vi.fn()
  },
  UserHistoryRepository: {
    create: vi.fn()
  }
}));

vi.mock('@/lib/reddit-api', () => ({
  fetchRedditUserData: vi.fn()
}));

vi.mock('@/lib/logging', () => ({
  DataCollectionLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/lib/error-handling', () => ({
  handleApiError: vi.fn(() => new Response('Error', { status: 500 }))
}));

import { TrackedUsersRepository, UserHistoryRepository } from '@/lib/database';
import { fetchRedditUserData } from '@/lib/reddit-api';

describe('Cron Data Collection Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = () => {
    return {
      headers: {
        get: () => null
      },
      ip: '127.0.0.1'
    } as NextRequest;
  };

  it('should handle a realistic data collection scenario', async () => {
    // Mock realistic user data
    const mockUsers = [
      { username: 'spez', id: '1', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { username: 'kn0thing', id: '2', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' },
      { username: 'nonexistentuser', id: '3', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' }
    ];

    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: mockUsers
    });

    // Mock Reddit API responses - some succeed, some fail
    vi.mocked(fetchRedditUserData).mockImplementation(async (username) => {
      switch (username) {
        case 'spez':
          return { karma: 150000, post_count: 1200 };
        case 'kn0thing':
          return { karma: 75000, post_count: 800 };
        case 'nonexistentuser':
          throw new Error('User not found or suspended');
        default:
          throw new Error('Unknown user');
      }
    });

    // Mock successful history creation for valid users
    vi.mocked(UserHistoryRepository.create).mockImplementation(async (username, karma, postCount) => {
      if (username === 'spez' || username === 'kn0thing') {
        return {
          success: true,
          data: {
            id: Math.random().toString(),
            username,
            karma,
            post_count: postCount,
            collected_at: new Date().toISOString()
          }
        };
      }
      return {
        success: false,
        error: 'User not found'
      };
    });

    vi.mocked(TrackedUsersRepository.updateLastUpdated).mockResolvedValue({
      success: true
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    // Verify response structure
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message', 'Data collection completed');
    expect(data).toHaveProperty('totalUsers', 3);
    expect(data).toHaveProperty('collected', 2);
    expect(data).toHaveProperty('errors', 1);
    expect(data).toHaveProperty('results');
    expect(data.results).toHaveLength(3);

    // Verify successful collections
    const spezResult = data.results.find((r: any) => r.username === 'spez');
    expect(spezResult).toBeDefined();
    expect(spezResult.success).toBe(true);
    expect(spezResult.karma).toBe(150000);
    expect(spezResult.postCount).toBe(1200);

    const kn0thingResult = data.results.find((r: any) => r.username === 'kn0thing');
    expect(kn0thingResult).toBeDefined();
    expect(kn0thingResult.success).toBe(true);
    expect(kn0thingResult.karma).toBe(75000);
    expect(kn0thingResult.postCount).toBe(800);

    // Verify failed collection
    const failedResult = data.results.find((r: any) => r.username === 'nonexistentuser');
    expect(failedResult).toBeDefined();
    expect(failedResult.success).toBe(false);
    expect(failedResult.error).toBe('User not found or suspended');

    // Verify repository calls
    expect(TrackedUsersRepository.getAll).toHaveBeenCalledTimes(1);
    expect(fetchRedditUserData).toHaveBeenCalledTimes(3);
    expect(UserHistoryRepository.create).toHaveBeenCalledTimes(2);
    expect(TrackedUsersRepository.updateLastUpdated).toHaveBeenCalledTimes(2);
  });

  it('should handle batch processing correctly', async () => {
    // Create a larger set of users to test batching
    const mockUsers = Array.from({ length: 12 }, (_, i) => ({
      username: `user${i + 1}`,
      id: (i + 1).toString(),
      is_active: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    }));

    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: mockUsers
    });

    // Mock successful Reddit API calls for all users
    vi.mocked(fetchRedditUserData).mockImplementation(async (username) => {
      const userNum = parseInt(username.replace('user', ''));
      return {
        karma: userNum * 1000,
        post_count: userNum * 10
      };
    });

    vi.mocked(UserHistoryRepository.create).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        username: 'test',
        karma: 1000,
        post_count: 10,
        collected_at: new Date().toISOString()
      }
    });

    vi.mocked(TrackedUsersRepository.updateLastUpdated).mockResolvedValue({
      success: true
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalUsers).toBe(12);
    expect(data.collected).toBe(12);
    expect(data.errors).toBe(0);
    expect(data.results).toHaveLength(12);

    // Verify all users were processed
    for (let i = 1; i <= 12; i++) {
      const userResult = data.results.find((r: any) => r.username === `user${i}`);
      expect(userResult).toBeDefined();
      expect(userResult.success).toBe(true);
      expect(userResult.karma).toBe(i * 1000);
      expect(userResult.postCount).toBe(i * 10);
    }
  });

  it('should handle complete system failure gracefully', async () => {
    // Mock database failure
    vi.mocked(TrackedUsersRepository.getAll).mockRejectedValue(
      new Error('Database connection timeout')
    );

    const request = createMockRequest();
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});