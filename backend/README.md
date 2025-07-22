# FitTrack Backend

Backend API for the FitTrack habit tracking application built with Node.js, Express, and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with bcrypt password hashing
- 👤 **User Management** - Profile management, preferences, and statistics
- 📋 **Habit Tracking** - CRUD operations for habits with completion tracking
- 🏆 **Achievements System** - Dynamic achievement tracking and progress monitoring
- 📊 **Data Export** - Export user data in JSON/CSV formats with backup functionality
- 🛡️ **Security** - Helmet, CORS, rate limiting, and input validation
- 📝 **Validation** - Comprehensive input validation with express-validator

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/preferences` - Update user preferences
- `PUT /api/users/stats` - Update user statistics
- `GET /api/users/dashboard` - Get dashboard data
- `DELETE /api/users/account` - Deactivate account

### Habits
- `GET /api/habits` - Get all user habits (with filters)
- `GET /api/habits/:id` - Get specific habit
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `POST /api/habits/:id/complete` - Mark habit as completed
- `DELETE /api/habits/:id` - Delete habit (soft delete)
- `GET /api/habits/:id/stats` - Get habit statistics

### Achievements
- `GET /api/achievements` - Get all achievements with user progress
- `GET /api/achievements/unlocked` - Get unlocked achievements
- `POST /api/achievements/check` - Check and update achievement progress
- `GET /api/achievements/:id` - Get specific achievement
- `GET /api/achievements/stats/summary` - Get achievement statistics

### Data Export
- `GET /api/export/data` - Export user data (JSON/CSV)
- `GET /api/export/backup` - Create full backup
- `GET /api/export/stats` - Export statistics summary

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (copy `.env.example` to `.env`):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fittrack
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:4200
```

3. Start MongoDB service

4. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Database Models

### User Model
- Profile information (name, email, password)
- Preferences (goals, notifications, theme)
- Statistics (streaks, completion rates)
- Timestamps and soft delete support

### Habit Model
- Habit details (title, description, category)
- Tracking data (frequency, target, completions)
- Streak calculations and progress tracking
- Reminders and customization options

### Achievement Models
- Achievement definitions with criteria
- User progress tracking
- Automatic progress calculation and unlocking

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token authentication
- Request rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- SQL injection prevention through Mongoose

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/fittrack |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | JWT expiration time | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:4200 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 (15 min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |

## Development

The server uses:
- **Express.js** - Web framework
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Validator** - Input validation
- **Express Rate Limit** - Rate limiting

## Health Check

The API includes a health check endpoint:
```
GET /api/health
```

Returns server status, timestamp, and version information.

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": []  // Validation errors if applicable
}
```

## License

MIT License
