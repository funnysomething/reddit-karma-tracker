import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../UserManagement';
import { TrackedUser } from '../../lib/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserManagement Component', () => {
  const mockUsers: TrackedUser[] = [
    {
      id: '1',
      username: 'testuser1',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      username: 'testuser2',
      is_active: true,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful users fetch by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockUsers
      })
    });
  });

  it('renders the component with title and form', async () => {
    render(<UserManagement />);
    
    expect(screen.getByText('Manage Tracked Users')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Reddit username (e.g., spez)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('Currently Tracked Users (2)')).toBeInTheDocument();
    });
  });

  it('loads and displays tracked users on mount', async () => {
    render(<UserManagement />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('u/testuser1')).toBeInTheDocument();
      expect(screen.getByText('u/testuser2')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/users');
  });

  it('shows loading state while fetching users', () => {
    render(<UserManagement />);
    
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('shows empty state when no users are tracked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: []
      })
    });

    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('No users are currently being tracked.')).toBeInTheDocument();
      expect(screen.getByText('Add a Reddit username above to get started.')).toBeInTheDocument();
    });
  });

  it('validates username input in real-time', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);
    
    const input = screen.getByPlaceholderText('Enter Reddit username (e.g., spez)');
    
    // Test empty input
    await user.type(input, 'ab');
    expect(screen.getByText('Username must be 3-20 characters long')).toBeInTheDocument();
    
    // Test invalid characters
    await user.clear(input);
    await user.type(input, 'test@user');
    expect(screen.getByText('Username can only contain letters, numbers, and underscores')).toBeInTheDocument();
    
    // Test valid input
    await user.clear(input);
    await user.type(input, 'validuser');
    expect(screen.queryByText(/Username must be/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Username can only contain/)).not.toBeInTheDocument();
  });

  it('prevents adding duplicate users', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('u/testuser1')).toBeInTheDocument();
    });
    
    const input = screen.getByPlaceholderText('Enter Reddit username (e.g., spez)');
    await user.type(input, 'testuser1');
    
    expect(screen.getByText('User is already being tracked')).toBeInTheDocument();
  });

  it('successfully adds a new user', async () => {
    const user = userEvent.setup();
    const onUserAdded = vi.fn();
    
    // Create a delayed promise for the add user request
    let resolveAddUser: (value: any) => void;
    const addUserPromise = new Promise((resolve) => {
      resolveAddUser = resolve;
    });
    
    // Mock successful add user response with delay
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers })
      })
      .mockReturnValueOnce(addUserPromise);

    render(<UserManagement onUserAdded={onUserAdded} />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('u/testuser1')).toBeInTheDocument();
    });
    
    const input = screen.getByPlaceholderText('Enter Reddit username (e.g., spez)');
    const addButton = screen.getByRole('button', { name: 'Add User' });
    
    await user.type(input, 'newuser');
    await user.click(addButton);
    
    // Check loading state
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    
    // Resolve the add user promise
    resolveAddUser!({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: '3',
          username: 'newuser',
          is_active: true,
          created_at: '2023-01-04T00:00:00Z',
          updated_at: '2023-01-04T00:00:00Z'
        }
      })
    });
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser' })
      });
    });
    
    // Check that callback was called
    await waitFor(() => {
      expect(onUserAdded).toHaveBeenCalledWith({
        id: '3',
        username: 'newuser',
        is_active: true,
        created_at: '2023-01-04T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z'
      });
    });
  });

  it('handles add user API errors', async () => {
    const user = userEvent.setup();
    
    // Mock initial load success, then add user failure
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Reddit user not found'
        })
      });

    render(<UserManagement />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('u/testuser1')).toBeInTheDocument();
    });
    
    const input = screen.getByPlaceholderText('Enter Reddit username (e.g., spez)');
    const addButton = screen.getByRole('button', { name: 'Add User' });
    
    await user.type(input, 'nonexistentuser');
    await user.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Reddit user not found')).toBeInTheDocument();
    });
  });

  it('successfully removes a user', async () => {
    const user = userEvent.setup();
    const onUserRemoved = vi.fn();
    
    // Mock successful remove user response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

    render(<UserManagement onUserRemoved={onUserRemoved} />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('u/testuser1')).toBeInTheDocument();
    });
    
    // Find and click remove button for testuser1
    const removeButtons = screen.getAllByTitle(/Remove .* from tracking/);
    await user.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/users/testuser1', {
        method: 'DELETE'
      });
    });
    
    // Check that callback was called
    await waitFor(() => {
      expect(onUserRemoved).toHaveBeenCalledWith('testuser1');
    });
  });

  it('handles remove user API errors', async () => {
    const user = userEvent.setup();
    
    // Mock initial load success, then remove user failure
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Failed to remove user'
        })
      });

    render(<UserManagement />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('u/testuser1')).toBeInTheDocument();
    });
    
    // Find and click remove button
    const removeButtons = screen.getAllByTitle(/Remove .* from tracking/);
    await user.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to remove user')).toBeInTheDocument();
    });
  });

  it('disables add button when input is invalid', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);
    
    const input = screen.getByPlaceholderText('Enter Reddit username (e.g., spez)');
    const addButton = screen.getByRole('button', { name: 'Add User' });
    
    // Button should be disabled initially
    expect(addButton).toBeDisabled();
    
    // Button should be disabled with invalid input
    await user.type(input, 'ab');
    expect(addButton).toBeDisabled();
    
    // Button should be enabled with valid input
    await user.clear(input);
    await user.type(input, 'validuser');
    
    await waitFor(() => {
      expect(addButton).not.toBeDisabled();
    });
  });

  it('shows usage instructions', async () => {
    render(<UserManagement />);
    
    expect(screen.getByText('How it works:')).toBeInTheDocument();
    expect(screen.getByText(/Add Reddit usernames to track/)).toBeInTheDocument();
    expect(screen.getByText(/Data is automatically collected daily/)).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error while loading users')).toBeInTheDocument();
    });
  });

  it('allows dismissing error messages', async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error while loading users')).toBeInTheDocument();
    });
    
    const dismissButton = screen.getByText('Dismiss');
    await user.click(dismissButton);
    
    expect(screen.queryByText('Network error while loading users')).not.toBeInTheDocument();
  });
});