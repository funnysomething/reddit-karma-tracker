import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
vi.mock('@/lib/database', () => ({
  TrackedUsersRepository: {
    getAll: vi.fn(),
    updateLastUpdated: vi.fn()
  },
  UserHistoryRepository: {
    create: vi.fn()
  }
}));

vi.mock('@/lib/reddit-oauth', () => ({
  fetchRedditUserDataOAuth: vi.fn()
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
import { fetchRedditUserDataOAuth } from '@/lib/reddit-oauth';
import { DataCollectionLogger } from '@/lib/logging';

describe('/api/cron/collect-data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.CRON_SECRET;
  });

  const createMockRequest = (headers: Record<string, string> = {}) => {
    return {
      headers: {
        get: (name: string) => headers[name] || null
      },
      ip: '127.0.0.1'
    } as NextRequest;
  };

  it('should successfully collect data for all users', async () => {
    // Mock successful responses
    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: [
        { username: 'user1', id: '1', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { username: 'user2', id: '2', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' }
      ]
    });

    vi.mocked(fetchRedditUserDataOAuth).mockImplementation(async (username) => ({
      karma: username === 'user1' ? 100 : 200,
      post_count: username === 'user1' ? 5 : 10
    }));

    vi.mocked(UserHistoryRepository.create).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        username: 'user1',
        karma: 100,
        post_count: 5,
        collected_at: '2023-01-01T12:00:00Z'
      }
    });

    vi.mocked(TrackedUsersRepository.updateLastUpdated).mockResolvedValue({
      success: true
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.collected).toBe(2);
    expect(data.errors).toBe(0);
    expect(data.totalUsers).toBe(2);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].success).toBe(true);
    expect(data.results[1].success).toBe(true);
  });

  it('should handle case when no users are tracked', async () => {
    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: []
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('No users to collect data for');
    expect(data.collected).toBe(0);
    expect(data.errors).toBe(0);
  });

  it('should handle Reddit API failures gracefully', async () => {
    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: [
        { username: 'user1', id: '1', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { username: 'user2', id: '2', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' }
      ]
    });

    vi.mocked(fetchRedditUserDataOAuth).mockImplementation(async (username) => {
      if (username === 'user1') {
        throw new Error('User not found');
      }
      return { karma: 200, post_count: 10 };
    });

    vi.mocked(UserHistoryRepository.create).mockResolvedValue({
      success: true,
      data: {
        id: '2',
        username: 'user2',
        karma: 200,
        post_count: 10,
        collected_at: '2023-01-01T12:00:00Z'
      }
    });

    vi.mocked(TrackedUsersRepository.updateLastUpdated).mockResolvedValue({
      success: true
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.collected).toBe(1);
    expect(data.errors).toBe(1);
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBe('User not found');
    expect(data.results[1].success).toBe(true);
  });

  it('should handle database failures when fetching users', async () => {
    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: false,
      error: 'Database connection failed'
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch tracked users');
    expect(data.details).toBe('Database connection failed');
  });

  it('should handle database failures when storing history', async () => {
    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: [
        { username: 'user1', id: '1', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' }
      ]
    });

    vi.mocked(fetchRedditUserDataOAuth).mockResolvedValue({
      username: 'testuser',
      karma: 100,
      post_count: 5
    });

    vi.mocked(UserHistoryRepository.create).mockResolvedValue({
      success: false,
      error: 'Failed to insert history'
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.collected).toBe(0);
    expect(data.errors).toBe(1);
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toContain('Failed to store history');
  });

  it('should verify cron secret when configured', async () => {
    process.env.CRON_SECRET = 'test-secret';

    // Test without authorization header
    let request = createMockRequest();
    let response = await POST(request);
    expect(response.status).toBe(401);

    // Test with wrong authorization header
    request = createMockRequest({ authorization: 'Bearer wrong-secret' });
    response = await POST(request);
    expect(response.status).toBe(401);

    // Test with correct authorization header
    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: []
    });

    request = createMockRequest({ authorization: 'Bearer test-secret' });
    response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should log appropriate messages during execution', async () => {
    vi.mocked(TrackedUsersRepository.getAll).mockResolvedValue({
      success: true,
      data: [
        { username: 'user1', id: '1', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01' }
      ]
    });

    vi.mocked(fetchRedditUserDataOAuth).mockResolvedValue({
      username: 'user1',
      karma: 100,
      post_count: 5
    });

    vi.mocked(UserHistoryRepository.create).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        username: 'user1',
        karma: 100,
        post_count: 5,
        collected_at: '2023-01-01T12:00:00Z'
      }
    });

    vi.mocked(TrackedUsersRepository.updateLastUpdated).mockResolvedValue({
      success: true
    });

    const request = createMockRequest();
    await POST(request);

    expect(DataCollectionLogger.info).toHaveBeenCalledWith('Starting automated data collection');
    expect(DataCollectionLogger.info).toHaveBeenCalledWith('Starting data collection for 1 users');
    expect(DataCollectionLogger.info).toHaveBeenCalledWith('Collecting data for user: user1');
    expect(DataCollectionLogger.info).toHaveBeenCalledWith('Successfully collected data for user1', {
      karma: 100,
      postCount: 5
    });
    expect(DataCollectionLogger.info).toHaveBeenCalledWith('Automated data collection completed', {
      totalUsers: 1,
      successful: 1,
      failed: 0
    });
  });
});