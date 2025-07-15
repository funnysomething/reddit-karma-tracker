import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { TrackedUsersRepository } from '../../../../lib/database';
import { validateRedditUsername } from '../../../../lib/reddit-api';

// Mock dependencies
vi.mock('../../../../lib/database');
vi.mock('../../../../lib/reddit-api');

const mockedTrackedUsersRepository = vi.mocked(TrackedUsersRepository);
const mockedValidateRedditUsername = vi.mocked(validateRedditUsername);

describe('/api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return list of tracked users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          username: 'testuser1',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true
        },
        {
          id: '2',
          username: 'testuser2',
          created_at: '2024-01-02T00:00:00Z',
          is_active: true
        }
      ];

      mockedTrackedUsersRepository.getAll.mockResolvedValueOnce({
        success: true,
        data: mockUsers
      });

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockUsers);
      expect(mockedTrackedUsersRepository.getAll).toHaveBeenCalledOnce();
    });

    it('should handle database errors', async () => {
      mockedTrackedUsersRepository.getAll.mockResolvedValueOnce({
        success: false,
        error: 'Database connection failed'
      });

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Database connection failed');
    });

    it('should handle unexpected errors', async () => {
      mockedTrackedUsersRepository.getAll.mockRejectedValueOnce(
        new Error('Unexpected error')
      );

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error while fetching users');
    });
  });

  describe('POST /api/users', () => {
    it('should add new user successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'newuser',
        created_at: '2024-01-01T00:00:00Z',
        is_active: true
      };

      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(false);
      mockedValidateRedditUsername.mockResolvedValueOnce(true);
      mockedTrackedUsersRepository.create.mockResolvedValueOnce({
        success: true,
        data: mockUser
      });

      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ username: 'newuser' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockUser);
      expect(mockedTrackedUsersRepository.exists).toHaveBeenCalledWith('newuser');
      expect(mockedValidateRedditUsername).toHaveBeenCalledWith('newuser');
      expect(mockedTrackedUsersRepository.create).toHaveBeenCalledWith('newuser');
    });

    it('should reject request with missing username', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Username is required and must be a string');
    });

    it('should reject request with invalid username format', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ username: 'ab' }), // Too short
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid username format');
    });

    it('should reject duplicate username', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ username: 'existinguser' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('User is already being tracked');
    });

    it('should reject non-existent Reddit user', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(false);
      mockedValidateRedditUsername.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ username: 'nonexistentuser' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Reddit user not found or account is suspended');
    });

    it('should handle Reddit API validation errors', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(false);
      mockedValidateRedditUsername.mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ username: 'testuser' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(503);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Unable to verify Reddit user. Please try again later.');
    });

    it('should handle database creation errors', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(false);
      mockedValidateRedditUsername.mockResolvedValueOnce(true);
      mockedTrackedUsersRepository.create.mockResolvedValueOnce({
        success: false,
        error: 'Database constraint violation'
      });

      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ username: 'testuser' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Failed to add user to tracking');
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid JSON in request body');
    });
  });
});