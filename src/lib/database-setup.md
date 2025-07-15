# Database Setup Instructions

## Supabase Database Setup

To set up the database schema for the Reddit Karma Tracker, follow these steps:

### 1. Create Tables and Indexes

Copy and paste the following SQL commands into your Supabase SQL Editor:

```sql
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
```

### 2. Verify Tables

After running the SQL commands, verify that the tables were created correctly:

```sql
-- Check tracked_users table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tracked_users';

-- Check user_history table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_history';

-- Check indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('tracked_users', 'user_history');
```

### 3. Test Data (Optional)

You can insert some test data to verify the setup:

```sql
-- Insert test user
INSERT INTO tracked_users (username) VALUES ('testuser123');

-- Insert test history data
INSERT INTO user_history (username, karma, post_count) 
VALUES ('testuser123', 1500, 25);
```

### 4. Row Level Security (Recommended)

For production, consider enabling Row Level Security:

```sql
-- Enable RLS on both tables
ALTER TABLE tracked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
CREATE POLICY "Allow all operations for authenticated users" ON tracked_users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON user_history
  FOR ALL USING (auth.role() = 'authenticated');
```

## Database Schema Overview

### tracked_users
- `id`: UUID primary key
- `username`: Reddit username (unique, max 50 chars)
- `created_at`: Timestamp when user was added to tracking
- `is_active`: Boolean flag for soft deletion

### user_history
- `id`: UUID primary key
- `username`: Foreign key reference to tracked_users.username
- `karma`: User's total karma at collection time
- `post_count`: User's total post count at collection time
- `collected_at`: Timestamp when data was collected

### Indexes
- `idx_tracked_users_username`: Fast username lookups
- `idx_user_history_username`: Fast history queries by username
- `idx_user_history_collected_at`: Fast time-based queries
- `idx_username_date`: Composite index for username + date queries