import { NextResponse } from 'next/server';
import { createRedditOAuthClient } from '../../../../lib/reddit-oauth';

// Debug endpoint to test Reddit OAuth functionality
export async function GET() {
  try {
    console.log('Testing Reddit OAuth configuration...');
    
    // Check environment variables
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const userAgent = process.env.REDDIT_USER_AGENT;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Reddit OAuth credentials not configured',
        config: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          hasUserAgent: !!userAgent,
          clientIdLength: clientId?.length || 0,
          userAgent: userAgent || 'NOT_SET'
        }
      }, { status: 500 });
    }
    
    // Test OAuth client creation and token retrieval
    const client = createRedditOAuthClient();
    const tokenStatus = client.getTokenStatus();
    
    console.log('OAuth client created, testing token...');
    
    // Test fetching a known user (spez - Reddit CEO)
    const testUsername = 'spez';
    const userData = await client.fetchUserData(testUsername);
    
    return NextResponse.json({
      success: true,
      message: 'Reddit OAuth working successfully',
      config: {
        hasClientId: true,
        hasClientSecret: true,
        hasUserAgent: !!userAgent,
        userAgent: userAgent || 'NOT_SET'
      },
      tokenStatus,
      testResult: {
        username: testUsername,
        data: userData
      }
    });
    
  } catch (error) {
    console.error('Reddit OAuth test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      config: {
        hasClientId: !!process.env.REDDIT_CLIENT_ID,
        hasClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
        hasUserAgent: !!process.env.REDDIT_USER_AGENT,
        userAgent: process.env.REDDIT_USER_AGENT || 'NOT_SET'
      }
    }, { status: 500 });
  }
}