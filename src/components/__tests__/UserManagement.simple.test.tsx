import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserManagement from '../UserManagement';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserManagement Component - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should render the component title', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    expect(screen.getByText('Manage Tracked Users')).toBeInTheDocument();
  });

  it('should render the input field', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    expect(screen.getByPlaceholderText('Enter Reddit username (e.g., spez)')).toBeInTheDocument();
  });

  it('should render the add button', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    // Arrange
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    // Act
    render(<UserManagement />);

    // Assert
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('should show empty state when no users are tracked', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('No users being tracked')).toBeInTheDocument();
    });
  });
});