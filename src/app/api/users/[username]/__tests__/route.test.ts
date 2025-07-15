import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, GET } from '../route';
import { TrackedUsersRepository } from '../../../../../lib/database';

// Mock dependencies
vi.mock('../../../../../lib/database');

const mockedTrackedUsersRepository = vi.mocked(TrackedUsersRepository);

describe('/api/users/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE /api/users/[username]', () => {
    it('should remove user successfully', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(true);
      mockedTrackedUsersRepository.delete.mockResolvedValueOnce({
        success: true
      });

      const request = new NextRequest('http://localhost/api/users/testuser', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { username: 'testuser' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockedTrackedUsersRepository.exists).toHaveBeenCalledWith('testuser');
      expect(mockedTrackedUsersRepository.delete).toHaveBeenCalledWith('testuser');
    });

    it('should reject request with invalid username format', async () => {
      const request = new NextRequest('http://localhost/api/users/ab', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { username: 'ab' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid username format');
    });

    it('should return 404 for non-existent user', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/users/nonexistentuser', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { username: 'nonexistentuser' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('User is not currently being tracked');
    });

    it('should handle database deletion errors', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(true);
      mockedTrackedUsersRepository.delete.mockResolvedValueOnce({
        success: false,
        error: 'Database error'
      });

      const request = new NextRequest('http://localhost/api/users/testuser', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { username: 'testuser' } });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Failed to remove user from tracking');
    });

    it('should handle unexpected errors', async () => {
      mockedTrackedUsersRepository.exists.mockRejectedValueOnce(
        new Error('Unexpected error')
      );

      const request = new NextRequest('http://localhost/api/users/testuser', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { username: 'testuser' } });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error while removing user');
    });

    it('should reject empty username parameter', async () => {
      const request = new NextRequest('http://localhost/api/users/', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { username: '' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Username parameter is required');
    });
  });

  describe('GET /api/users/[username]', () => {
    it('should return user status when user exists', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost/api/users/testuser', {
        method: 'GET'
      });

      const response = await GET(request, { params: { username: 'testuser' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual({
        username: 'testuser',
        exists: true
      });
    });

    it('should return user status when user does not exist', async () => {
      mockedTrackedUsersRepository.exists.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/users/nonexistentuser', {
        method: 'GET'
      });

      const response = await GET(request, { params: { username: 'nonexistentuser' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual({
        username: 'nonexistentuser',
        exists: false
      });
    });

    it('should reject invalid username format', async () => {
      const request = new NextRequest('http://localhost/api/users/ab', {
        method: 'GET'
      });

      const response = await GET(request, { params: { username: 'ab' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid username format');
    });

    it('should handle database errors', async () => {
      mockedTrackedUsersRepository.exists.mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/users/testuser', {
        method: 'GET'
      });

      const response = await GET(request, { params: { username: 'testuser' } });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error while checking user status');
    });
  });
});