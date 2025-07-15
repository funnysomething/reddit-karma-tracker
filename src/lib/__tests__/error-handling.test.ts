import { describe, it, expect } from 'vitest';
import {
  classifyRedditError,
  getUserFriendlyErrorMessage,
  shouldRetryError,
  getHttpStatusForError,
  RedditErrorType
} from '../error-handling';

describe('Error Handling Utilities', () => {
  const mockUsername = 'testuser';

  describe('classifyRedditError', () => {
    it('should classify 404 axios error as USER_NOT_FOUND', () => {
      // Arrange
      const error = {
        response: { status: 404 }
      };

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.USER_NOT_FOUND);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should classify 403 axios error as USER_SUSPENDED', () => {
      // Arrange
      const error = {
        response: { status: 403 }
      };

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.USER_SUSPENDED);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('should classify 429 axios error as RATE_LIMITED', () => {
      // Arrange
      const error = {
        response: { status: 429 }
      };

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.RATE_LIMITED);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
      expect(result.statusCode).toBe(429);
    });

    it('should classify 500 axios error as API_UNAVAILABLE', () => {
      // Arrange
      const error = {
        response: { status: 500 }
      };

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.API_UNAVAILABLE);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
      expect(result.statusCode).toBe(500);
    });

    it('should classify Error with "not found" message as USER_NOT_FOUND', () => {
      // Arrange
      const error = new Error('User not found or data unavailable');

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.USER_NOT_FOUND);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(false);
    });

    it('should classify Error with "suspended" message as USER_SUSPENDED', () => {
      // Arrange
      const error = new Error('User account is suspended');

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.USER_SUSPENDED);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(false);
    });

    it('should classify Error with "rate limit" message as RATE_LIMITED', () => {
      // Arrange
      const error = new Error('Rate limit exceeded');

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.RATE_LIMITED);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
    });

    it('should classify Error with "network" message as NETWORK_ERROR', () => {
      // Arrange
      const error = new Error('Network timeout occurred');

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.NETWORK_ERROR);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
    });

    it('should classify Error with "invalid" message as INVALID_DATA', () => {
      // Arrange
      const error = new Error('Invalid data structure received');

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.INVALID_DATA);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(false);
    });

    it('should classify Error with "database" message as DATABASE_ERROR', () => {
      // Arrange
      const error = new Error('Database connection failed');

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.DATABASE_ERROR);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
    });

    it('should classify unknown Error as UNKNOWN_ERROR', () => {
      // Arrange
      const error = new Error('Some unexpected error');

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.UNKNOWN_ERROR);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
    });

    it('should classify string error as UNKNOWN_ERROR', () => {
      // Arrange
      const error = 'String error message';

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.UNKNOWN_ERROR);
      expect(result.message).toBe(error);
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
    });

    it('should classify null/undefined error as UNKNOWN_ERROR', () => {
      // Arrange
      const error = null;

      // Act
      const result = classifyRedditError(error, mockUsername);

      // Assert
      expect(result.type).toBe(RedditErrorType.UNKNOWN_ERROR);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.username).toBe(mockUsername);
      expect(result.retryable).toBe(true);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return user-friendly message for USER_NOT_FOUND', () => {
      // Arrange
      const error = {
        type: RedditErrorType.USER_NOT_FOUND,
        message: 'User not found',
        username: mockUsername,
        retryable: false
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe(`User '${mockUsername}' was not found on Reddit. They may have deleted their account.`);
    });

    it('should return user-friendly message for USER_SUSPENDED', () => {
      // Arrange
      const error = {
        type: RedditErrorType.USER_SUSPENDED,
        message: 'User suspended',
        username: mockUsername,
        retryable: false
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe(`User '${mockUsername}' is suspended or has made their profile private.`);
    });

    it('should return user-friendly message for RATE_LIMITED', () => {
      // Arrange
      const error = {
        type: RedditErrorType.RATE_LIMITED,
        message: 'Rate limit exceeded',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe('Reddit API rate limit exceeded. Please try again in a few minutes.');
    });

    it('should return user-friendly message for API_UNAVAILABLE', () => {
      // Arrange
      const error = {
        type: RedditErrorType.API_UNAVAILABLE,
        message: 'API unavailable',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe('Reddit API is temporarily unavailable. Please try again later.');
    });

    it('should return user-friendly message for NETWORK_ERROR', () => {
      // Arrange
      const error = {
        type: RedditErrorType.NETWORK_ERROR,
        message: 'Network error',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe('Network error occurred. Please check your connection and try again.');
    });

    it('should return user-friendly message for INVALID_DATA', () => {
      // Arrange
      const error = {
        type: RedditErrorType.INVALID_DATA,
        message: 'Invalid data',
        username: mockUsername,
        retryable: false
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe(`Invalid data received for user '${mockUsername}'. This may be a temporary issue.`);
    });

    it('should return user-friendly message for DATABASE_ERROR', () => {
      // Arrange
      const error = {
        type: RedditErrorType.DATABASE_ERROR,
        message: 'Database error',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe('Database error occurred while saving data. Please try again.');
    });

    it('should return user-friendly message for UNKNOWN_ERROR', () => {
      // Arrange
      const error = {
        type: RedditErrorType.UNKNOWN_ERROR,
        message: 'Unknown error occurred',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getUserFriendlyErrorMessage(error);

      // Assert
      expect(result).toBe('Unknown error occurred');
    });
  });

  describe('shouldRetryError', () => {
    it('should return true for retryable errors', () => {
      // Arrange
      const error = {
        type: RedditErrorType.RATE_LIMITED,
        message: 'Rate limit exceeded',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = shouldRetryError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      // Arrange
      const error = {
        type: RedditErrorType.USER_NOT_FOUND,
        message: 'User not found',
        username: mockUsername,
        retryable: false
      };

      // Act
      const result = shouldRetryError(error);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getHttpStatusForError', () => {
    it('should return status code from error if available', () => {
      // Arrange
      const error = {
        type: RedditErrorType.USER_NOT_FOUND,
        message: 'User not found',
        username: mockUsername,
        retryable: false,
        statusCode: 404
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(404);
    });

    it('should return 404 for USER_NOT_FOUND without status code', () => {
      // Arrange
      const error = {
        type: RedditErrorType.USER_NOT_FOUND,
        message: 'User not found',
        username: mockUsername,
        retryable: false
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(404);
    });

    it('should return 403 for USER_SUSPENDED', () => {
      // Arrange
      const error = {
        type: RedditErrorType.USER_SUSPENDED,
        message: 'User suspended',
        username: mockUsername,
        retryable: false
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(403);
    });

    it('should return 429 for RATE_LIMITED', () => {
      // Arrange
      const error = {
        type: RedditErrorType.RATE_LIMITED,
        message: 'Rate limit exceeded',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(429);
    });

    it('should return 503 for API_UNAVAILABLE', () => {
      // Arrange
      const error = {
        type: RedditErrorType.API_UNAVAILABLE,
        message: 'API unavailable',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(503);
    });

    it('should return 503 for NETWORK_ERROR', () => {
      // Arrange
      const error = {
        type: RedditErrorType.NETWORK_ERROR,
        message: 'Network error',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(503);
    });

    it('should return 422 for INVALID_DATA', () => {
      // Arrange
      const error = {
        type: RedditErrorType.INVALID_DATA,
        message: 'Invalid data',
        username: mockUsername,
        retryable: false
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(422);
    });

    it('should return 500 for DATABASE_ERROR', () => {
      // Arrange
      const error = {
        type: RedditErrorType.DATABASE_ERROR,
        message: 'Database error',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(500);
    });

    it('should return 500 for UNKNOWN_ERROR', () => {
      // Arrange
      const error = {
        type: RedditErrorType.UNKNOWN_ERROR,
        message: 'Unknown error',
        username: mockUsername,
        retryable: true
      };

      // Act
      const result = getHttpStatusForError(error);

      // Assert
      expect(result).toBe(500);
    });
  });
});