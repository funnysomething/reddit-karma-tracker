import { NextRequest, NextResponse } from 'next/server';
import { POST as collectData } from '../collect-data/route';

// Manual test endpoint for the cron job (development only)
export async function POST() {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Test endpoint not available in production' 
    }, { status: 403 });
  }

  try {
    // Create a mock request without authorization header for testing
    const mockRequest = {
      headers: {
        get: (name: string) => {
          if (name === 'authorization') return null;
          if (name === 'user-agent') return 'Manual Test';
          return null;
        }
      },
      ip: '127.0.0.1'
    } as NextRequest;

    // Call the actual cron endpoint
    const response = await collectData(mockRequest);
    const data = await response.json();

    return NextResponse.json({
      message: 'Manual cron test completed',
      timestamp: new Date().toISOString(),
      result: data
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cron test endpoint',
    description: 'Use POST to manually trigger data collection for testing',
    note: 'Only available in development environment'
  });
}