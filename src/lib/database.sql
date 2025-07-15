-- Database schema for Reddit Karma Tracker
-- Run these commands in your Supabase SQL editor

-- Create tracked_users table
CREATE TABLE IF NOT EXISTS tracked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user_history table
CREATE TABLE IF NOT EXISTS user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  karma INTEGER NOT NULL,
  post_count INTEGER NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (username) REFERENCES tracked_users(username) ON DELETE CASCADE
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_tracked_users_username ON tracked_users(username);
CREATE INDEX IF NOT EXISTS idx_user_history_username ON user_history(username);
CREATE INDEX IF NOT EXISTS idx_user_history_collected_at ON user_history(collected_at);
CREATE INDEX IF NOT EXISTS idx_username_date ON user_history(username, collected_at);