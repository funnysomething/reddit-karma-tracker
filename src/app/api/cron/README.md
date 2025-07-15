# Automated Data Collection (Cron Jobs)

This directory contains the automated data collection system that runs on a scheduled basis to collect Reddit karma and post count data for all tracked users.

## Endpoints

### `/api/cron/collect-data` (POST)
The main cron endpoint that collects data for all tracked users.

**Schedule**: Daily at 6:00 AM UTC (configured in `vercel.json`)

**Features**:
- Fetches all active tracked users from the database
- Collects current karma and post count from Reddit API for each user
- Stores historical data in the `user_history` table
- Updates the `updated_at` timestamp for each user
- Processes users in batches of 5 to respect Reddit API rate limits
- Includes 2-second delays between batches
- Comprehensive error handling and logging
- Returns detailed results including success/failure counts

**Security**:
- Optional CRON_SECRET environment variable for authentication
- IP and user agent logging for security monitoring

**Response Format**:
```json
{
  "message": "Data collection completed",
  "totalUsers": 10,
  "collected": 8,
  "errors": 2,
  "results": [
    {
      "username": "user1",
      "success": true,
      "karma": 1500,
      "postCount": 25
    },
    {
      "username": "user2",
      "success": false,
      "error": "User not found or suspended"
    }
  ]
}
```

### `/api/cron/test` (POST)
Manual test endpoint for development and debugging.

**Availability**: Development environment only
**Purpose**: Manually trigger data collection for testing purposes

## Configuration

### Environment Variables
- `CRON_SECRET` (optional): Bearer token for authenticating cron requests
- `NODE_ENV`: Environment detection for test endpoint availability

### Vercel Configuration
The cron job is configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/collect-data",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Schedule Format**: Uses standard cron syntax
- `0 6 * * *` = Daily at 6:00 AM UTC
- Modify as needed for different collection frequencies

## Error Handling

The system includes comprehensive error handling:

1. **Database Errors**: Failed user fetching or history storage
2. **Reddit API Errors**: User not found, suspended accounts, rate limiting
3. **Network Errors**: Connection timeouts, DNS failures
4. **Authentication Errors**: Invalid or missing cron secret

All errors are logged with appropriate context and don't stop the collection process for other users.

## Rate Limiting

To respect Reddit's API guidelines:
- Users are processed in batches of 5
- 2-second delay between batches
- Individual request failures don't affect other users
- Exponential backoff is handled by the Reddit API client

## Monitoring

The system provides detailed logging for monitoring:
- Start/completion of collection cycles
- Individual user processing status
- Error details with context
- Performance metrics (users processed, success/failure counts)

## Testing

Comprehensive test coverage includes:
- Unit tests for the cron endpoint
- Integration tests for the complete workflow
- Error scenario testing
- Batch processing verification
- Authentication testing

Run tests with:
```bash
npm test -- src/app/api/cron
```

## Manual Testing

For development and debugging:

1. **Using the test endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/test
   ```

2. **Direct cron endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/collect-data
   ```

3. **With authentication** (if CRON_SECRET is set):
   ```bash
   curl -X POST http://localhost:3000/api/cron/collect-data \
     -H "Authorization: Bearer your-cron-secret"
   ```

## Deployment

The cron job automatically deploys with your Vercel application. No additional configuration is required beyond the `vercel.json` file.

**Important**: Ensure your Supabase database and Reddit API access are properly configured in the production environment.

## Troubleshooting

Common issues and solutions:

1. **Cron not running**: Check Vercel dashboard for cron execution logs
2. **Authentication failures**: Verify CRON_SECRET environment variable
3. **Database errors**: Check Supabase connection and table schemas
4. **Reddit API errors**: Verify rate limiting and user agent configuration
5. **High error rates**: Check for suspended/deleted Reddit accounts

## Future Enhancements

Potential improvements:
- Configurable collection frequency per user
- Retry logic for failed collections
- Data collection metrics and analytics
- Email notifications for collection failures
- Webhook support for real-time updates