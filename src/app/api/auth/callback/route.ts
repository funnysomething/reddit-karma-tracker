import { NextRequest, NextResponse } from 'next/server';

// OAuth callback handler for Reddit authentication
// This is mainly for setup verification since we use client credentials flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  console.log('Reddit OAuth callback received:', { code: !!code, error, state });

  if (error) {
    console.error('Reddit OAuth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Reddit OAuth error: ${error}` 
      },
      { status: 400 }
    );
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.json(
      { 
        success: false, 
        error: 'No authorization code received' 
      },
      { status: 400 }
    );
  }

  // For this application, we primarily use client credentials flow
  // This callback is mainly for initial setup verification
  console.log('Reddit OAuth setup verification successful');

  return NextResponse.json({
    success: true,
    message: 'Reddit OAuth callback received successfully',
    note: 'This app uses client credentials flow for server-to-server authentication'
  });
}