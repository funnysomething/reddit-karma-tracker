import { NextRequest, NextResponse } from 'next/server';
import { TrackedUsersRepository, validateUsername } from '../../../lib/database';
import { validateRedditUsername } from '../../../lib/reddit-api';
import { validateRedditUserWithProxy } from '../../../lib/reddit-proxy';
import { ApiResponse, TrackedUser } from '../../../lib/types';

// GET /api/users - Retrieve list of tracked users
export async function GET(): Promise<NextResponse<ApiResponse<TrackedUser[]>>> {
  try {
    const result = await TrackedUsersRepository.getAll();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching tracked users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching users' 
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Add new user to tracking
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<TrackedUser>>> {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate request body
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username is required and must be a string' 
        },
        { status: 400 }
      );
    }

    // Validate username format
    if (!validateUsername(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid username format. Username must be 3-20 characters, alphanumeric and underscores only' 
        },
        { status: 400 }
      );
    }

    // Check if user already exists in tracking
    const userExists = await TrackedUsersRepository.exists(username);
    if (userExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User is already being tracked' 
        },
        { status: 409 }
      );
    }

    // Validate that the Reddit user actually exists with fallback
    try {
      let redditUserExists = false;
      
      // Try main Reddit API first
      try {
        redditUserExists = await validateRedditUsername(username);
      } catch (error) {
        console.error('Primary Reddit validation failed, trying proxy:', error);
        
        // Try proxy as fallback
        try {
          redditUserExists = await validateRedditUserWithProxy(username);
          console.log(`Proxy validation successful for ${username}`);
        } catch (proxyError) {
          console.error('Proxy validation also failed:', proxyError);
          throw error; // Throw original error
        }
      }
      
      if (!redditUserExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Reddit user not found or account is suspended' 
          },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Error validating Reddit username:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unable to verify Reddit user. Please try again later.' 
        },
        { status: 503 }
      );
    }

    // Add user to tracking
    const result = await TrackedUsersRepository.create(username);
    
    if (!result.success) {
      console.error('Database error creating user:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add user to tracking' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding user to tracking:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while adding user' 
      },
      { status: 500 }
    );
  }
}