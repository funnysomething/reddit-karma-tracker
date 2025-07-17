# 🚀 Local Development Setup Guide

This guide will help you run the Reddit Karma Tracker locally on your machine before deploying to Vercel.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- A Supabase account (free)

## 🛠️ Step-by-Step Local Setup

### 1. Install Dependencies

```bash
# Navigate to the project directory
cd Reddit_Tracker

# Install all dependencies
npm install

# Verify installation
npm run build
```

### 2. Set Up Supabase Database

#### Option A: Create New Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be ready (~2 minutes)

#### Option B: Use Existing Project
If you already have a Supabase project, you can use it.

#### Get Your Supabase Credentials
1. Go to Settings → API in your Supabase dashboard
2. Copy your `Project URL` and `anon public` key
3. Keep these handy for the next step

### 3. Create Database Tables

1. Go to SQL Editor in your Supabase dashboard
2. Run this SQL script to create the required tables:

```sql
-- Create tracked_users table
CREATE TABLE IF NOT EXISTS tracked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_history table
CREATE TABLE IF NOT EXISTS user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  karma INTEGER NOT NULL,
  post_count INTEGER NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracked_users_username ON tracked_users(username);
CREATE INDEX IF NOT EXISTS idx_tracked_users_active ON tracked_users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_history_username ON user_history(username);
CREATE INDEX IF NOT EXISTS idx_user_history_collected_at ON user_history(collected_at);

-- Enable Row Level Security (RLS)
ALTER TABLE tracked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
CREATE POLICY IF NOT EXISTS "Allow public read access on tracked_users" ON tracked_users
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert access on tracked_users" ON tracked_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update access on tracked_users" ON tracked_users
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Allow public delete access on tracked_users" ON tracked_users
  FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access on user_history" ON user_history
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert access on user_history" ON user_history
  FOR INSERT WITH CHECK (true);
```

3. Verify the tables were created by going to Table Editor

### 4. Configure Environment Variables

1. **Copy the example environment file:**
```bash
cp .env.local.example .env.local
```

2. **Edit `.env.local` with your credentials:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Reddit API Configuration
REDDIT_USER_AGENT=RedditKarmaTracker/1.0 (by /u/yourusername)

# Optional: For cron job testing
CRON_SECRET=your-random-secret-for-testing
```

**Replace:**
- `your-project-id` with your actual Supabase project ID
- `your-anon-key-here` with your actual anon key from Supabase
- `yourusername` with your Reddit username

### 5. Test the Setup

#### Test Database Connection
```bash
# Test the Reddit API
npm run test:reddit

# Test with multiple users
npm run test:reddit-multi
```

#### Test the Application
```bash
# Start the development server
npm run dev
```

Open your browser to `http://localhost:3000`

### 6. Verify Everything Works

1. **Test User Management:**
   - Add a Reddit username (try 'spez', 'kn0thing', or 'funnysomething')
   - Verify the user appears in your tracked users list
   - Check that the user was added to your Supabase database

2. **Test Data Collection:**
   - Visit `http://localhost:3000/api/cron/collect-data` in your browser
   - This should collect data for all tracked users
   - Check your Supabase `user_history` table for new entries

3. **Test Charts:**
   - After collecting some data, charts should display
   - Try switching between individual and combined views
   - Test different time ranges

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run Reddit API integration tests (Node.js environment)
npm run test:node

# Test Reddit API with a single user
npm run test:reddit

# Test Reddit API with multiple users
npm run test:reddit-multi

# Run tests in watch mode
npm run test:watch
```

## 🔧 Development Workflow

### Daily Development
```bash
# Start development server
npm run dev

# In another terminal, run tests
npm run test:watch

# Test API endpoints manually
curl http://localhost:3000/api/users
curl http://localhost:3000/api/reddit/user/funnysomething
```

### Adding Test Data
You can manually add some test data to see charts:

1. Add a few users through the UI
2. Visit `http://localhost:3000/api/cron/collect-data` to collect initial data
3. Wait a day or manually insert historical data in Supabase
4. Charts will show trends over time

### Manual Data Collection
```bash
# Collect data for all tracked users
curl http://localhost:3000/api/cron/collect-data

# Test specific user data
curl http://localhost:3000/api/reddit/user/spez
```

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to connect to Supabase"**
   - Check your `.env.local` file
   - Verify Supabase URL and key are correct
   - Make sure your Supabase project is active

2. **"Reddit API not working"**
   - Check your internet connection
   - Verify the Reddit username exists
   - Make sure you're not hitting rate limits

3. **"Tables don't exist"**
   - Run the SQL script again in Supabase
   - Check the Table Editor to verify tables exist
   - Make sure RLS policies are set up

4. **"Charts not showing"**
   - Make sure you have data in the `user_history` table
   - Try collecting data first: visit `/api/cron/collect-data`
   - Check browser console for JavaScript errors

### Debug Mode

Add this to your `.env.local` for more detailed logging:
```env
NODE_ENV=development
DEBUG=true
```

### Checking Logs

- **Browser Console**: F12 → Console tab
- **Terminal**: Check the terminal where you ran `npm run dev`
- **Supabase**: Go to Logs section in your Supabase dashboard

## 📊 Sample Data for Testing

If you want to see charts immediately, you can insert some sample data:

```sql
-- Insert sample users
INSERT INTO tracked_users (username) VALUES 
  ('spez'),
  ('funnysomething'),
  ('kn0thing')
ON CONFLICT (username) DO NOTHING;

-- Insert sample history data (adjust dates as needed)
INSERT INTO user_history (username, karma, post_count, collected_at) VALUES
  ('spez', 930000, 179000, NOW() - INTERVAL '7 days'),
  ('spez', 930500, 179100, NOW() - INTERVAL '6 days'),
  ('spez', 931000, 179200, NOW() - INTERVAL '5 days'),
  ('spez', 931500, 179300, NOW() - INTERVAL '4 days'),
  ('spez', 931885, 179717, NOW()),
  
  ('funnysomething', 1, 1, NOW() - INTERVAL '3 days'),
  ('funnysomething', 1, 1, NOW());
```

## 🚀 Ready for Deployment?

Once everything works locally:

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Vercel:**
   - Connect your GitHub repo to Vercel
   - Add the same environment variables in Vercel dashboard
   - Deploy!

3. **Verify Production:**
   - Test the deployed app
   - Check that cron jobs work
   - Monitor for any issues

## 🎉 You're Ready!

Your local development environment is now set up and ready. You can:

- ✅ Add and manage Reddit users
- ✅ Collect karma and post count data
- ✅ View interactive charts
- ✅ Test all functionality locally
- ✅ Deploy to Vercel with confidence

Happy coding! 🚀