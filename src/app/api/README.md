# Reddit Karma Tracker API Documentation

## User Management Endpoints

### GET /api/users
Retrieve list of all tracked users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "reddit_user",
      "created_at": "2024-01-01T00:00:00Z",
      "is_active": true
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### POST /api/users
Add a new user to tracking.

**Request Body:**
```json
{
  "username": "reddit_username"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "reddit_username",
    "created_at": "2024-01-01T00:00:00Z",
    "is_active": true
  }
}
```

**Error Responses:**
- `400` - Invalid username format or missing username
- `404` - Reddit user not found
- `409` - User already being tracked
- `503` - Unable to verify Reddit user

### DELETE /api/users/[username]
Remove a user from tracking.

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400` - Invalid username format
- `404` - User not currently being tracked
- `500` - Database error

### GET /api/users/[username]
Check if a user is being tracked.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "username": "reddit_username",
    "exists": true
  }
}
```

## Username Validation Rules

- Must be 3-20 characters long
- Can only contain letters, numbers, and underscores
- No spaces or special characters (except underscore)

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Example Usage

### Add a user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "spez"}'
```

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Remove a user
```bash
curl -X DELETE http://localhost:3000/api/users/spez
```

### Check user status
```bash
curl http://localhost:3000/api/users/spez
```