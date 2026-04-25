# Tonalli Services API

Backend services for the Tonalli language learning platform built with NestJS, Stellar blockchain, and ACTA credentials.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 📚 **Learning Management** - Lessons, chapters, quizzes, and progress tracking
- ⭐ **Gamification** - XP, levels, streaks, and weekly leaderboards
- 🏆 **Podium System** - Weekly competitions with blockchain rewards
- 🎓 **Certificates** - Verifiable credentials via ACTA on Stellar
- 💰 **Blockchain Integration** - Stellar/Soroban for rewards and NFTs
- 🔔 **Notifications** - In-app notification system for async events
- 🏥 **Health Monitoring** - System health checks for all services

## Tech Stack

- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: MySQL with TypeORM
- **Blockchain**: Stellar (Testnet) + Soroban smart contracts
- **Credentials**: ACTA SDK for verifiable credentials
- **Authentication**: JWT with Passport
- **Scheduling**: @nestjs/schedule for cron jobs

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=tonalli

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Stellar
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_ADMIN_SECRET=YOUR_STELLAR_SECRET_KEY
REWARD_POOL_SECRET=YOUR_REWARD_POOL_SECRET_KEY

# ACTA
ACTA_API_KEY=your-acta-api-key
ACTA_BASE_URL=https://acta.build/api/testnet
```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000`

### Database Setup

The application uses TypeORM with `synchronize: true` in development, which automatically creates/updates tables. For production, use migrations.

### Seeding Data

```bash
npm run seed
```

## API Documentation

### Core Endpoints

#### Health Check

```
GET /api/health
```

Returns system health status for database, Stellar, and ACTA services.

[Full Health Check Documentation](./NOTIFICATIONS_AND_HEALTH.md#health-check-endpoint)

#### Authentication

```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
GET /api/auth/profile - Get current user profile
```

#### Lessons & Learning

```
GET /api/lessons - List all lessons
GET /api/lessons/:id - Get lesson details
POST /api/lessons/:id/complete - Mark lesson as complete
GET /api/chapters - List all chapters
GET /api/chapters/:id - Get chapter details
POST /api/chapters/:id/complete - Complete chapter with exam score
```

#### Progress & Gamification

```
GET /api/progress - Get user progress
GET /api/progress/stats - Get user stats (XP, level, streak)
GET /api/podium/weekly - Get weekly leaderboard
GET /api/podium/rewards - Get user's podium rewards
```

#### Certificates

```
POST /api/certificates/issue - Issue ACTA certificate
GET /api/certificates/user/:userId - Get user certificates
GET /api/certificates/verify/:vcId - Verify certificate
```

#### Notifications

```
GET /api/notifications - Get user notifications
GET /api/notifications/unread-count - Get unread count
POST /api/notifications/:id/read - Mark as read
POST /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id - Delete notification
```

[Full Notifications Documentation](./NOTIFICATIONS_AND_HEALTH.md#notifications-system)

## Architecture

### Module Structure

```
src/
├── auth/           # Authentication & authorization
├── users/          # User management & profiles
├── lessons/        # Lessons & quizzes
├── chapters/       # Chapter management
├── progress/       # Progress tracking & XP
├── podium/         # Weekly leaderboard & rewards
├── certificates/   # ACTA certificate management
├── stellar/        # Stellar blockchain integration
├── acta/           # ACTA SDK integration
├── notifications/  # Notification system
├── health/         # Health check endpoints
└── app.module.ts   # Root module
```

### Database Entities

- **User** - User accounts with Stellar wallets
- **Lesson** - Individual learning lessons
- **Quiz** - Lesson quizzes
- **Progress** - User lesson progress
- **Chapter** - Course chapters
- **ChapterProgress** - User chapter progress
- **Streak** - Daily learning streaks
- **WeeklyScore** - Weekly leaderboard scores
- **PodiumReward** - Podium rewards history
- **ActaCertificate** - Issued certificates
- **NFTCertificate** - NFT certificate metadata
- **Notification** - User notifications

## Blockchain Integration

### Stellar/Soroban

The platform uses Stellar blockchain for:

- User wallet creation
- XLM reward distribution
- NFT certificate minting
- Transaction verification

[Stellar Service Documentation](./src/stellar/stellar.service.ts)

### ACTA Credentials

ACTA provides verifiable credentials for course completion:

- W3C Verifiable Credentials standard
- On-chain storage on Stellar
- Cryptographic verification
- Portable credentials

[ACTA Service Documentation](./src/acta/acta.service.ts)

## Notification System

The notification system provides real-time feedback for:

- ✅ Certificate issued
- 💰 Reward processed
- 🔥 Streak lost/milestone
- ⬆️ Level up
- 🏆 Podium rewards
- 📚 Lesson/chapter completion

[Integration Examples](./INTEGRATION_EXAMPLES.md)

## Development

### Adding Notifications to Services

1. Import `NotificationsModule` in your module
2. Inject `NotificationsService` in your service
3. Call notification methods after async operations

```typescript
await this.notificationsService.notifyCertificateIssued(userId, {
  title: 'Course Title',
  txHash: 'tx-hash',
  vcId: 'vc-id',
});
```

See [Integration Examples](./INTEGRATION_EXAMPLES.md) for detailed examples.

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format
```

## Deployment

### Production Checklist

- [ ] Set `synchronize: false` in TypeORM config
- [ ] Use database migrations instead of auto-sync
- [ ] Set strong `JWT_SECRET`
- [ ] Use production Stellar network (if applicable)
- [ ] Configure proper CORS settings
- [ ] Set up logging and monitoring
- [ ] Enable rate limiting
- [ ] Use environment-specific configs
- [ ] Set up SSL/TLS
- [ ] Configure backup strategy

### Environment Variables (Production)

Ensure all sensitive variables are properly secured:

- Use secrets management (AWS Secrets Manager, etc.)
- Never commit `.env` files
- Rotate keys regularly
- Use different keys per environment

## Monitoring

### Health Checks

Monitor system health at `/api/health`:

- Database connectivity
- Stellar/Soroban availability
- ACTA service reachability

Set up automated monitoring to alert on degraded/down status.

### Logging

The application uses NestJS Logger:

```typescript
this.logger.log('Info message');
this.logger.error('Error message');
this.logger.warn('Warning message');
```

Configure log levels per environment.

## Troubleshooting

### Database Connection Issues

- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists
- Check firewall rules

### Stellar Integration Issues

- Verify Horizon URL is accessible
- Check if testnet is operational
- Ensure admin wallet has XLM balance
- Verify secret keys are valid

### ACTA Integration Issues

- Verify API key is valid
- Check ACTA service status
- Ensure admin wallet is authorized
- Review ACTA logs for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:

- Create an issue on GitHub
- Contact the development team
- Check documentation

## Roadmap

- [ ] WebSocket support for real-time notifications
- [ ] Push notifications (FCM/APNS)
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Social features (friends, sharing)
- [ ] Achievement badges system
- [ ] Custom learning paths
