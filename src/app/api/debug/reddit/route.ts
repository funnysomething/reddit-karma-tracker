import { NextResponse } from 'next/server';

// Debug endpoint to test Reddit API directly
export async function GET() {
  try {
    const userAgent = process.env.REDDIT_USER_AGENT || 'RedditKarmaTracker/1.0 (Debug Test)';
    
    console.log('Testing Reddit API with User-Agent:', userAgent);
    
    const response = await fetch('https://www.reddit.com/user/spez/about.json', {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
    });

    console.log('Reddit API Response Status:', response.status);
    console.log('Reddit API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Reddit API returned ${response.status}: ${response.statusText}`,
        userAgent,
        responseHeaders: Object.fromEntries(response.headers.entries())
      }, { status: 503 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      userAgent,
      redditResponse: {
        status: response.status,
        hasData: !!data.data,
        username: data.data?.name,
        karma: data.data ? (data.data.link_karma + data.data.comment_karma) : null
      }
    });

  } catch (error) {
    console.error('Reddit API Debug Error:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      userAgent: process.env.REDDIT_USER_AGENT || 'NOT_SET'
    }, { status: 500 });
  }
}