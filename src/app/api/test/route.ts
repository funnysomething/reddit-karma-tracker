import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    version: '1.0.1' // Trigger redeploy
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST method working!',
    timestamp: new Date().toISOString()
  });
}