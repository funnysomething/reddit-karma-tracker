import { NextRequest, NextResponse } from 'next/server';
import { TrackedUsersRepository, validateUsername } from '../../../../lib/database';
import { ApiResponse } from '../../../../lib/types';

interface RouteParams {
  params: {
    username: string;
  };
}

// DELETE /api/users/[username] - Remove user from tracking
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const { username } = params;

    // Validate username parameter
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username parameter is required' 
        },
        { status: 400 }
      );
    }

    // Validate username format
    if (!validateUsername(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid username format' 
        },
        { status: 400 }
      );
    }

    // Check if user exists in tracking
    const userExists = await TrackedUsersRepository.exists(username);
    if (!userExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User is not currently being tracked' 
        },
        { status: 404 }
      );
    }

    // Remove user from tracking (soft delete by setting is_active to false)
    const result = await TrackedUsersRepository.delete(username);
    
    if (!result.success) {
      console.error('Database error removing user:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to remove user from tracking' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error removing user from tracking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while removing user' 
      },
      { status: 500 }
    );
  }
}

// GET /api/users/[username] - Get specific user info (optional endpoint for future use)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ username: string; exists: boolean }>>> {
  try {
    const { username } = params;

    // Validate username parameter
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username parameter is required' 
        },
        { status: 400 }
      );
    }

    // Validate username format
    if (!validateUsername(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid username format' 
        },
        { status: 400 }
      );
    }

    // Check if user exists in tracking
    const userExists = await TrackedUsersRepository.exists(username);

    return NextResponse.json({
      success: true,
      data: {
        username,
        exists: userExists
      }
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while checking user status' 
      },
      { status: 500 }
    );
  }
}