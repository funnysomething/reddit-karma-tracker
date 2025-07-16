'use client';

import React, { useState, useEffect } from 'react';
import { TrackedUser, ApiResponse } from '../lib/types';

interface UserManagementProps {
  className?: string;
  onUserAdded?: (user: TrackedUser) => void;
  onUserRemoved?: (username: string) => void;
}

export default function UserManagement({
  className = '',
  onUserAdded,
  onUserRemoved
}: UserManagementProps) {
  const [username, setUsername] = useState('');
  const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load tracked users on component mount
  useEffect(() => {
    loadTrackedUsers();
  }, []);

  const loadTrackedUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch('/api/users');
      const data: ApiResponse<TrackedUser[]> = await response.json();

      if (data.success) {
        setTrackedUsers(data.data || []);
      } else {
        setError(data.error || 'Failed to load tracked users');
      }
    } catch {
      setError('Network error while loading users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Username is required';
    }

    if (username.length < 3 || username.length > 20) {
      return 'Username must be 3-20 characters long';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    if (trackedUsers.some(user => user.username.toLowerCase() === username.toLowerCase())) {
      return 'User is already being tracked';
    }

    return null;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setValidationError(null);
    setError(null);

    // Real-time validation
    if (value.trim()) {
      const validation = validateUsername(value.trim());
      setValidationError(validation);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;

    // Final validation
    const validation = validateUsername(trimmedUsername);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      const data: ApiResponse<TrackedUser> = await response.json();

      if (data.success && data.data) {
        const newUser = data.data;
        setTrackedUsers(prev => [...prev, newUser]);
        setUsername('');
        setValidationError(null);
        
        // Notify parent component
        onUserAdded?.(newUser);
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch {
      setError('Network error while adding user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (usernameToRemove: string) => {
    try {
      const response = await fetch(`/api/users/${usernameToRemove}`, {
        method: 'DELETE',
      });

      const data: ApiResponse<void> = await response.json();

      if (data.success) {
        setTrackedUsers(prev => prev.filter(user => user.username !== usernameToRemove));
        
        // Notify parent component
        onUserRemoved?.(usernameToRemove);
      } else {
        setError(data.error || 'Failed to remove user');
      }
    } catch {
      setError('Network error while removing user');
    }
  };

  return (
    <div className={`bg-secondary rounded-lg shadow-theme-md p-6 transition-theme ${className}`}>
      <h2 className="text-xl font-semibold text-primary mb-4">
        Manage Tracked Users
      </h2>

      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="username" className="sr-only">
              Reddit Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter Reddit username (e.g., spez)"
              className={`w-full px-4 py-2 border rounded-md bg-primary text-primary placeholder:text-muted focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-theme ${
                validationError ? 'border-accent-destructive' : 'border-default'
              }`}
              disabled={isLoading}
            />
            {validationError && (
              <p className="mt-1 text-sm text-accent-destructive">{validationError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !!validationError || !username.trim()}
            className="px-6 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] transition-theme"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              'Add User'
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-accent-destructive/10 border border-accent-destructive/20 rounded-md">
          <p className="text-sm text-accent-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-accent-destructive hover:text-accent-destructive/80 underline transition-theme"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tracked Users List */}
      <div>
        <h3 className="text-lg font-medium text-secondary mb-3">
          Currently Tracked Users ({trackedUsers.length})
        </h3>

        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            <span className="ml-3 text-secondary">Loading users...</span>
          </div>
        ) : trackedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <svg className="mx-auto h-12 w-12 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-sm">No users are currently being tracked.</p>
            <p className="text-xs text-muted mt-1">Add a Reddit username above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trackedUsers.map((user) => (
              <div
                key={user.username}
                className="flex items-center justify-between p-3 bg-tertiary rounded-md hover:bg-accent transition-theme"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-primary">u/{user.username}</p>
                    <p className="text-xs text-muted">
                      Added {new Date(user.created_at).toLocaleDateString()}
                      {user.updated_at && user.updated_at !== user.created_at && (
                        <span> • Last updated {new Date(user.updated_at).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveUser(user.username)}
                  className="p-2 text-accent-destructive hover:text-accent-destructive/80 hover:bg-accent-destructive/10 rounded-md transition-theme"
                  title={`Remove ${user.username} from tracking`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-md">
        <h4 className="text-sm font-medium text-accent-primary mb-2">How it works:</h4>
        <ul className="text-xs text-accent-primary/80 space-y-1">
          <li>• Add Reddit usernames to track their karma and post count over time</li>
          <li>• Data is automatically collected daily at 6 AM UTC</li>
          <li>• View historical charts and trends for each tracked user</li>
          <li>• Remove users you no longer want to track</li>
        </ul>
      </div>
    </div>
  );
}