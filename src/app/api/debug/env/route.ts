import { NextResponse } from 'next/server';

// Debug endpoint to check environment variables (REMOVE IN PRODUCTION!)
export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasRedditUserAgent: !!process.env.REDDIT_USER_AGENT,
    redditUserAgent: process.env.REDDIT_USER_AGENT || 'NOT_SET',
    supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    timestamp: new Date().toISOString()
  });
}