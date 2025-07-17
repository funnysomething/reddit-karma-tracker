// Environment variable validation
export function validateEnvVars() {
  // Skip validation in test environment or during build
  if (
    process.env.NODE_ENV === 'test' || 
    process.env.VITEST === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    typeof window !== 'undefined' // Skip on client side
  ) {
    return;
  }

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  )

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }
}

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
  REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT || 'TestAgent/1.0',
}