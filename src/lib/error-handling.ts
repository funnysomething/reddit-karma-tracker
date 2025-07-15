// Error handling utilities for Reddit data collection

export enum RedditErrorType {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_DELETED = 'USER_DELETED',
  RATE_LIMITED = 'RATE_LIMITED',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_DATA = 'INVALID_DATA',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface RedditError {
  type: RedditErrorType;
  message: string;
  username?: string;
  retryable: boolean;
  statusCode?: number;
}

/**
 * Classify and handle Reddit API errors
 */
export function classifyRedditError(error: unknown, username?: string): RedditError {
  // Handle axios errors
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: any } };
    const status = axiosError.response?.status;
    
    switch (status) {
      case 404:
        return {
          type: RedditErrorType.USER_NOT_FOUND,
          message: `Reddit user '${username}' not found`,
          username,
          retryable: false,
          statusCode: 404
        };
      
      case 403:
        return {
          type: RedditErrorType.USER_SUSPENDED,
          message: `Reddit user '${username}' is suspended or private`,
          username,
          retryable: false,
          statusCode: 403
        };
      
      case 429:
        return {
          type: RedditErrorType.RATE_LIMITED,
          message: 'Reddit API rate limit exceeded',
          username,
          retryable: true,
          statusCode: 429
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: RedditErrorType.API_UNAVAILABLE,
          message: 'Reddit API is temporarily unavailable',
          username,
          retryable: true,
          statusCode: status
        };
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('not found') || message.includes('unavailable')) {
      return {
        type: RedditErrorType.USER_NOT_FOUND,
        message: `Reddit user '${username}' not found or unavailable`,
        username,
        retryable: false
      };
    }
    
    if (message.includes('suspended') || message.includes('private')) {
      return {
        type: RedditErrorType.USER_SUSPENDED,
        message: `Reddit user '${username}' is suspended or private`,
        username,
        retryable: false
      };
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        type: RedditErrorType.RATE_LIMITED,
        message: 'Reddit API rate limit exceeded',
        username,
        retryable: true
      };
    }
    
    if (message.includes('database') || message.includes('supabase')) {
      return {
        type: RedditErrorType.DATABASE_ERROR,
        message: 'Database error while storing user data',
        username,
        retryable: true
      };
    }
    
    if (message.includes('invalid') || message.includes('structure')) {
      return {
        type: RedditErrorType.INVALID_DATA,
        message: `Invalid data structure received for user '${username}'`,
        username,
        retryable: false
      };
    }
    
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return {
        type: RedditErrorType.NETWORK_ERROR,
        message: 'Network error while accessing Reddit API',
        username,
        retryable: true
      };
    }
    
    return {
      type: RedditErrorType.UNKNOWN_ERROR,
      message: error.message,
      username,
      retryable: true
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: RedditErrorType.UNKNOWN_ERROR,
      message: error,
      username,
      retryable: true
    };
  }

  // Handle unknown error types
  return {
    type: RedditErrorType.UNKNOWN_ERROR,
    message: 'An unknown error occurred',
    username,
    retryable: true
  };
}

/**
 * Get user-friendly error message for display
 */
export function getUserFriendlyErrorMessage(error: RedditError): string {
  switch (error.type) {
    case RedditErrorType.USER_NOT_FOUND:
      return `User '${error.username}' was not found on Reddit. They may have deleted their account.`;
    
    case RedditErrorType.USER_SUSPENDED:
      return `User '${error.username}' is suspended or has made their profile private.`;
    
    case RedditErrorType.RATE_LIMITED:
      return 'Reddit API rate limit exceeded. Please try again in a few minutes.';
    
    case RedditErrorType.API_UNAVAILABLE:
      return 'Reddit API is temporarily unavailable. Please try again later.';
    
    case RedditErrorType.NETWORK_ERROR:
      return 'Network error occurred. Please check your connection and try again.';
    
    case RedditErrorType.INVALID_DATA:
      return `Invalid data received for user '${error.username}'. This may be a temporary issue.`;
    
    case RedditErrorType.DATABASE_ERROR:
      return 'Database error occurred while saving data. Please try again.';
    
    case RedditErrorType.UNKNOWN_ERROR:
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Determine if an error should trigger a retry
 */
export function shouldRetryError(error: RedditError): boolean {
  return error.retryable;
}

/**
 * Get appropriate HTTP status code for an error
 */
export function getHttpStatusForError(error: RedditError): number {
  if (error.statusCode) {
    return error.statusCode;
  }
  
  switch (error.type) {
    case RedditErrorType.USER_NOT_FOUND:
      return 404;
    
    case RedditErrorType.USER_SUSPENDED:
      return 403;
    
    case RedditErrorType.RATE_LIMITED:
      return 429;
    
    case RedditErrorType.API_UNAVAILABLE:
    case RedditErrorType.NETWORK_ERROR:
      return 503;
    
    case RedditErrorType.INVALID_DATA:
      return 422;
    
    case RedditErrorType.DATABASE_ERROR:
    case RedditErrorType.UNKNOWN_ERROR:
    default:
      return 500;
  }
}