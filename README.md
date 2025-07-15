# Reddit Karma Tracker

A comprehensive web application that monitors and visualizes Reddit user karma and post count history over time. Features automated daily data collection, interactive charts, and multi-user comparison analytics.

![Reddit Karma Tracker](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## ✨ Features

- 📊 **Interactive Charts**: Visualize karma and post count trends with Chart.js
- 👥 **Multi-User Tracking**: Monitor multiple Reddit users simultaneously
- 📈 **Combined Analytics**: Compare users side-by-side with overlaid charts
- ⏰ **Automated Collection**: Daily data collection via Vercel cron jobs
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🎨 **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- 🔄 **Real-time Updates**: Live data fetching and chart updates
- 🎯 **Time Range Filtering**: View data for 1d, 7d, 30d, 90d, or all time

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript 5
- **Styling**: Tailwind CSS 3
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js with react-chartjs-2
- **Hosting**: Vercel (with cron jobs)
- **API**: Reddit JSON API
- **Testing**: Vitest with React Testing Library

## 🚀 Complete Deployment Guide

### Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account (free)
- Supabase account (free)

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd Reddit_Tracker

# Install dependencies
npm install

# Verify installation
npm run build
```

### Step 2: Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project to be ready (~2 minutes)

2. **Get Database Credentials**
   - Go to Settings → API
   - Copy your `Project URL` and `anon public` key
   - Save these for later

3. **Create Database Tables**
   - Go to SQL Editor in Supabase dashboard
   - Run the following SQL commands:

```sql
-- Create tracked_users table
CREATE TABLE tracked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_history table
CREATE TABLE user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  karma INTEGER NOT NULL,
  post_count INTEGER NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (username) REFERENCES tracked_users(username)
);

-- Create indexes for better performance
CREATE INDEX idx_tracked_users_username ON tracked_users(username);
CREATE INDEX idx_tracked_users_active ON tracked_users(is_active);
CREATE INDEX idx_user_history_username ON user_history(username);
CREATE INDEX idx_user_history_collected_at ON user_history(collected_at);
CREATE INDEX idx_user_history_username_date ON user_history(username, collected_at);

-- Enable Row Level Security (RLS)
ALTER TABLE tracked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access on tracked_users" ON tracked_users
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on tracked_users" ON tracked_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on tracked_users" ON tracked_users
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on user_history" ON user_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on user_history" ON user_history
  FOR INSERT WITH CHECK (true);
```

4. **Verify Tables Created**
   - Go to Table Editor
   - Confirm `tracked_users` and `user_history` tables exist

### Step 3: Environment Configuration

1. **Create Environment File**
```bash
# Copy the example file
cp .env.local.example .env.local
```

2. **Configure Environment Variables**
Edit `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Reddit API Configuration
REDDIT_USER_AGENT=RedditKarmaTracker/1.0 (by /u/yourusername)

# Optional: Cron Job Security (recommended for production)
CRON_SECRET=your-random-secret-string-here
```

**Important Notes:**
- Replace `your-project-id` with your actual Supabase project ID
- Replace `your-anon-key-here` with your actual anon key from Supabase
- Replace `/u/yourusername` with your Reddit username
- Generate a random string for `CRON_SECRET` (optional but recommended)

### Step 4: Local Development Testing

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
# Test the application:
# 1. Add a Reddit username (try 'spez' or 'kn0thing')
# 2. Verify user appears in the list
# 3. Check that API endpoints work
```

### Step 5: Deploy to Vercel

1. **Push to GitHub**
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/reddit-karma-tracker.git
git branch -M main
git push -u origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: Next.js
     - Root Directory: `Reddit_Tracker` (if in subdirectory)
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Configure Environment Variables in Vercel**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
REDDIT_USER_AGENT = RedditKarmaTracker/1.0 (by /u/yourusername)
CRON_SECRET = your-random-secret-string-here
```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (~2-3 minutes)
   - Visit your deployed application

### Step 6: Verify Deployment

1. **Test Core Functionality**
   - Visit your Vercel URL
   - Add a Reddit username
   - Verify user management works
   - Check that charts display (may be empty initially)

2. **Test Cron Job (Optional)**
   - Visit `https://your-app.vercel.app/api/cron/test` (development only)
   - Or manually trigger: `https://your-app.vercel.app/api/cron/collect-data`
   - Check Vercel Functions logs for execution

3. **Monitor Data Collection**
   - Cron job runs daily at 6:00 AM UTC automatically
   - Check Supabase dashboard → Table Editor → `user_history` for collected data
   - Data will accumulate over time to show trends

### Step 7: Production Configuration

1. **Security Enhancements**
   - Set up proper RLS policies in Supabase if needed
   - Configure CORS settings
   - Set up monitoring and alerts

2. **Performance Optimization**
   - Enable Vercel Analytics (optional)
   - Configure caching headers
   - Monitor function execution times

3. **Monitoring Setup**
   - Check Vercel Functions logs regularly
   - Monitor Supabase usage
   - Set up error tracking (optional)

## 📊 Usage Guide

### Adding Users
1. Enter a Reddit username in the input field
2. Click "Add User" to start tracking
3. User will appear in the tracked users list

### Viewing Charts
- **Individual View**: Select a user to see their karma/post history
- **Combined View**: Compare multiple users side-by-side
- Use time range filters (1D, 7D, 30D, 90D, All)
- Toggle between Karma and Post Count metrics

### Data Collection
- Data is automatically collected daily at 6:00 AM UTC
- Historical data builds up over time
- Charts become more meaningful with more data points

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

### Project Structure

```
Reddit_Tracker/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   │   ├── cron/          # Automated data collection
│   │   │   ├── reddit/        # Reddit API integration
│   │   │   └── users/         # User management
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── UserManagement.tsx # User CRUD operations
│   │   ├── KarmaChart.tsx     # Individual charts
│   │   ├── CombinedChart.tsx  # Multi-user comparison
│   │   └── __tests__/         # Component tests
│   └── lib/                   # Utilities and configurations
│       ├── database.ts        # Database operations
│       ├── reddit-api.ts      # Reddit API client
│       ├── types.ts           # TypeScript interfaces
│       ├── logging.ts         # Logging utilities
│       └── error-handling.ts  # Error management
├── vercel.json                # Vercel configuration (cron jobs)
├── vitest.config.mjs          # Test configuration
└── tailwind.config.ts         # Tailwind CSS config
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/components/__tests__/UserManagement.test.tsx

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to fetch users"**
   - Check Supabase connection
   - Verify environment variables
   - Check RLS policies

2. **"Reddit user not found"**
   - Verify username spelling
   - Check if user account exists and is public
   - Some users may have privacy settings

3. **Cron job not running**
   - Check Vercel Functions logs
   - Verify `vercel.json` configuration
   - Ensure deployment was successful

4. **Charts not displaying**
   - Check browser console for errors
   - Verify data exists in database
   - Check Chart.js dependencies

### Debug Mode

Enable debug logging by adding to your environment:
```env
NODE_ENV=development
```

### Getting Help

1. Check Vercel Functions logs
2. Check Supabase logs
3. Check browser developer console
4. Review error messages in the application

## 📈 Monitoring and Maintenance

### Regular Checks
- Monitor Vercel function execution
- Check Supabase database usage
- Review error logs weekly
- Verify cron job execution

### Scaling Considerations
- Supabase free tier: 500MB database, 2GB bandwidth
- Vercel free tier: 100GB bandwidth, 6000 function executions
- Consider upgrading if limits are reached

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Reddit for providing the public API
- Supabase for the excellent database platform
- Vercel for seamless deployment and hosting
- Chart.js for beautiful data visualization

---

**🎉 Your Reddit Karma Tracker is now fully deployed and ready to use!**

Visit your application and start tracking Reddit users to see their karma and post count trends over time.