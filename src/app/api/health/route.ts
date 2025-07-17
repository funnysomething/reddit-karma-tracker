import { NextResponse } from 'next/server';

// Simple health check endpoint to verify API routes are working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Reddit Karma Tracker API is running',
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0'
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    method: 'POST',
    message: 'POST method working'
  });
}