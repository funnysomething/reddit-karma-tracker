import { NextRequest, NextResponse } from 'next/server';
import { fetchRedditUserDataOAuth } from '../../../../../lib/reddit-oauth';
import { UserHistoryRepository, validateUsername } from '../../../../../lib/database';
import { ApiResponse, RedditUserData } from '../../../../../lib/types';

interface RouteParams {
  params: {
    username: string;
  };
}

// Helper function to handle Reddit OAuth API errors
function handleRedditOAuthError(error: unknown, username: string): NextResponse<ApiResponse<RedditUserData>> {
  console.error(`Error fetching Reddit data for ${username}:`, error);
  
  // Handle specific error cases
  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit user not found, deleted, or suspended' 
        },
        { status: 404 }
      );
    }
    
    if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit API rate limit exceeded. Please try again later.' 
        },
        { status: 429 }
      );
    }

    if (error.message.includes('OAuth') || error.message.includes('credentials')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit API authentication failed. Please check server configuration.' 
        },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json(
    { 
      success: false, 
      error: 'Unable to fetch Reddit user data. Please try again later.' 
    },
    { status: 503 }
  );
}

// POST /api/reddit/user/[username] - Fetch and store current Reddit user data
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<RedditUserData>>> {
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
          error: 'Invalid username format. Username must be 3-20 characters, alphanumeric and underscores only' 
        },
        { status: 400 }
      );
    }

    // Fetch current Reddit user data using OAuth
    let redditUserData: RedditUserData;
    try {
      console.log(`Fetching Reddit user data via OAuth for: ${username}`);
      redditUserData = await fetchRedditUserDataOAuth(username);
      console.log(`Successfully fetched data for ${username}:`, redditUserData);
    } catch (error) {
      return handleRedditOAuthError(error, username);
    }

    // Store the data in the database
    const storeResult = await UserHistoryRepository.create(
      redditUserData.username,
      redditUserData.karma,
      redditUserData.post_count
    );

    if (!storeResult.success) {
      console.error(`Error storing data for ${username}:`, storeResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to store user data in database' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: redditUserData
    });
  } catch (error) {
    console.error('Error in POST /api/reddit/user/[username]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while collecting user data' 
      },
      { status: 500 }
    );
  }
}

// GET /api/reddit/user/[username] - Fetch current Reddit user data without storing
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<RedditUserData>>> {
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
          error: 'Invalid username format. Username must be 3-20 characters, alphanumeric and underscores only' 
        },
        { status: 400 }
      );
    }

    // Fetch current Reddit user data using OAuth
    let redditUserData: RedditUserData;
    try {
      console.log(`Fetching Reddit user data via OAuth for: ${username}`);
      redditUserData = await fetchRedditUserDataOAuth(username);
      console.log(`Successfully fetched data for ${username}:`, redditUserData);
    } catch (error) {
      return handleRedditOAuthError(error, username);
    }

    return NextResponse.json({
      success: true,
      data: redditUserData
    });
  } catch (error) {
    console.error('Error in GET /api/reddit/user/[username]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching user data' 
      },
      { status: 500 }
    );
  }
}