import { NextRequest, NextResponse } from 'next/server';
import { UserHistoryRepository, TrackedUsersRepository, validateUsername } from '../../../../../lib/database';
import { ApiResponse, HistoryData } from '../../../../../lib/types';

interface RouteParams {
  params: {
    username: string;
  };
}

// GET /api/users/[username]/history - Get historical data for a specific user
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<HistoryData[]>>> {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);

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

    // Check if user is being tracked
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

    // Parse optional query parameters
    const limitParam = searchParams.get('limit');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let limit: number | undefined;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Limit parameter must be a positive integer' 
          },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Handle date range queries
    if (startDateParam || endDateParam) {
      if (!startDateParam || !endDateParam) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Both startDate and endDate parameters are required for date range queries' 
          },
          { status: 400 }
        );
      }

      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' 
          },
          { status: 400 }
        );
      }

      if (startDate >= endDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Start date must be before end date' 
          },
          { status: 400 }
        );
      }

      // Fetch data for date range
      const result = await UserHistoryRepository.getHistoryForDateRange(username, startDate, endDate);
      
      if (!result.success) {
        console.error(`Error fetching history for ${username}:`, result.error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to fetch user history data' 
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data
      });
    }

    // Fetch all history data (with optional limit)
    const result = await UserHistoryRepository.getByUsername(username, limit);
    
    if (!result.success) {
      console.error(`Error fetching history for ${username}:`, result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch user history data' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/users/[username]/history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching user history' 
      },
      { status: 500 }
    );
  }
}