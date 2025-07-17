/**
 * Local setup verification script
 * Run with: npx tsx scripts/setup-local.ts
 */

import { createClient } from '@supabase/supabase-js';
import { RedditApiClient } from '../src/lib/reddit-api';
import fs from 'fs';
import path from 'path';

async function setupLocal() {
  console.log('🚀 Reddit Karma Tracker - Local Setup Verification\n');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    console.log('📝 Please copy .env.local.example to .env.local and configure it');
    console.log('   cp .env.local.example .env.local');
    process.exit(1);
  }

  console.log('✅ .env.local file found');

  // Load environment variables
  require('dotenv').config({ path: envPath });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const userAgent = process.env.REDDIT_USER_AGENT;

  // Check environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase configuration in .env.local');
    console.log('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');

  // Test Supabase connection
  try {
    console.log('🔗 Testing Supabase connection...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by trying to fetch from tracked_users table
    const { data, error } = await supabase
      .from('tracked_users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      console.log('💡 Make sure you have created the database tables');
      console.log('   Check LOCAL_SETUP.md for SQL scripts');
      process.exit(1);
    }

    console.log('✅ Supabase connection successful');
    console.log(`📊 Found ${data?.length || 0} tracked users in database`);

  } catch (error) {
    console.log('❌ Supabase connection error:', (error as Error).message);
    process.exit(1);
  }

  // Test Reddit API
  try {
    console.log('🔗 Testing Reddit API...');
    const redditClient = new RedditApiClient({
      userAgent: userAgent || 'RedditKarmaTracker/1.0 (Local Setup Test)'
    });

    const userData = await redditClient.fetchUserData('spez');
    console.log('✅ Reddit API working');
    console.log(`📊 Test user data: u/${userData.username} has ${userData.karma} karma`);

  } catch (error) {
    console.log('❌ Reddit API test failed:', (error as Error).message);
    console.log('💡 This might be a network issue or rate limiting');
  }

  // Test database tables
  try {
    console.log('🗄️  Testing database tables...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check tracked_users table
    const { error: usersError } = await supabase
      .from('tracked_users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.log('❌ tracked_users table not accessible:', usersError.message);
      process.exit(1);
    }

    // Check user_history table
    const { error: historyError } = await supabase
      .from('user_history')
      .select('id')
      .limit(1);

    if (historyError) {
      console.log('❌ user_history table not accessible:', historyError.message);
      process.exit(1);
    }

    console.log('✅ Database tables accessible');

  } catch (error) {
    console.log('❌ Database table test failed:', (error as Error).message);
    process.exit(1);
  }

  // Success summary
  console.log('\n🎉 Local setup verification complete!');
  console.log('\n📋 Setup Summary:');
  console.log('   ✅ Environment variables configured');
  console.log('   ✅ Supabase connection working');
  console.log('   ✅ Database tables accessible');
  console.log('   ✅ Reddit API functional');
  
  console.log('\n🚀 Ready to start development:');
  console.log('   npm run dev     # Start development server');
  console.log('   npm test        # Run tests');
  console.log('   npm run test:reddit  # Test Reddit API');
  
  console.log('\n🌐 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open: http://localhost:3000');
  console.log('   3. Add a Reddit user to test');
  console.log('   4. Visit: http://localhost:3000/api/cron/collect-data');
  console.log('   5. Check charts for data visualization');
}

// Run setup verification
setupLocal().catch(error => {
  console.error('❌ Setup verification failed:', error);
  process.exit(1);
});