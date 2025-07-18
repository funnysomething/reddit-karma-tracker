# 🔄 Database Migration Guide for Comment Tracking

This guide will help you migrate your Reddit Karma Tracker database to support comment tracking functionality.

## 📊 Overview

The Reddit Karma Tracker now supports tracking comment karma alongside post karma. This requires a database schema update to add a `comment_count` column to the `user_history` table.

## 🔍 Check Current Database State

First, check if your database already has the `comment_count` column:

### Step 1: Check Table Structure
Run this query in your Supabase SQL editor:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_history' 
ORDER BY ordinal_position;
```

**Expected Result:**
- If you see `comment_count` in the results, your database is already updated ✅
- If you don't see `comment_count`, you need to run the migration ⚠️

## 🚀 Migration Steps

### Step 2: Run Database Migration

If the `comment_count` column is missing, execute this migration script in your Supabase SQL editor:

```sql
-- Add comment_count column to existing user_history table
ALTER TABLE user_history 
ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

-- Update existing records to have comment_count = 0 
-- (will be populated on next data collection)
UPDATE user_history 
SET comment_count = 0 
WHERE comment_count IS NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_history' 
ORDER BY ordinal_position;
```

### Step 3: Verify Migration Success

After running the migration, you should see:
- A new `comment_count` column of type `integer`
- Default value of `0`
- All existing records have `comment_count = 0`

## 🔧 Code Updates (Already Applied)

The following code changes have been made to support comment tracking:

### ✅ Updated Files:
1. **Cron Job** (`src/app/api/cron/collect-data/route.ts`)
   - Now uses OAuth API
   - Passes `comment_count` to database

2. **Individual User API** (`src/app/api/reddit/user/[username]/route.ts`)
   - Now passes `comment_count` to database

3. **Setup Documentation** (`LOCAL_SETUP.md`)
   - Updated schema includes `comment_count`
   - Sample data includes comment values

### ✅ Already Working:
- Database repository accepts `comment_count` parameter
- Reddit OAuth API fetches comment karma
- Data collection service handles comments
- UI components support comment display

## 🧪 Test the Migration

### Step 4: Test Data Collection

1. **Trigger Manual Data Collection:**
   ```bash
   # Visit this URL in your browser or use curl
   curl https://your-app.vercel.app/api/cron/collect-data
   ```

2. **Check New Data:**
   ```sql
   SELECT username, karma, post_count, comment_count, collected_at 
   FROM user_history 
   ORDER BY collected_at DESC 
   LIMIT 10;
   ```

3. **Verify Comment Data:**
   - New records should have `comment_count > 0` for active users
   - Old records will still have `comment_count = 0`

### Step 5: Test Individual User Collection

```bash
# Test fetching a specific user
curl -X POST https://your-app.vercel.app/api/reddit/user/spez
```

## 📈 What Happens Next

### Immediate Effects:
- ✅ New data collection includes comment counts
- ✅ Database stores comment data
- ✅ API endpoints return comment information

### Gradual Improvements:
- 📊 Charts will show comment data as new data is collected
- 📈 Historical comment trends will build over time
- 🎯 Comment analytics will become more meaningful

## 🐛 Troubleshooting

### Common Issues:

1. **Migration Fails:**
   ```sql
   -- Check if table exists
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'user_history';
   
   -- Check current structure
   \d user_history
   ```

2. **Comment Count Still Zero:**
   - Wait for next scheduled data collection (daily at 6 AM UTC)
   - Or trigger manual collection via API endpoint
   - Check Reddit OAuth credentials are configured

3. **API Errors:**
   - Verify `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` are set
   - Check Supabase connection is working
   - Review application logs for specific errors

### Rollback (if needed):
```sql
-- Only if you need to remove the column (not recommended)
ALTER TABLE user_history DROP COLUMN IF EXISTS comment_count;
```

## 🎉 Success Checklist

After migration, verify these items:

- [ ] ✅ Database has `comment_count` column
- [ ] ✅ Existing data has `comment_count = 0`
- [ ] ✅ New data collection includes comment counts
- [ ] ✅ API endpoints return comment data
- [ ] ✅ No application errors in logs
- [ ] ✅ Charts display comment options (may need new data)

## 📞 Support

If you encounter issues:

1. **Check Application Logs:**
   - Vercel: Function logs in dashboard
   - Local: Terminal output from `npm run dev`

2. **Verify Environment Variables:**
   ```bash
   # Required for comment tracking
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. **Test Database Connection:**
   ```sql
   SELECT COUNT(*) FROM tracked_users;
   SELECT COUNT(*) FROM user_history;
   ```

## 🚀 Next Steps

After successful migration:

1. **Monitor Data Collection:**
   - Check daily cron job execution
   - Verify comment data is being collected
   - Monitor for any API errors

2. **Explore New Features:**
   - View comment charts in the UI
   - Compare comment vs post activity
   - Analyze comment growth trends

3. **Optional Enhancements:**
   - Set up monitoring alerts
   - Configure backup schedules
   - Consider additional metrics

---

**Migration Complete!** 🎉 Your Reddit Karma Tracker now supports comprehensive comment tracking alongside existing karma and post metrics.