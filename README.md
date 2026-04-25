# 🌟 Tonalli - Learn to Earn Platform

Tonalli is a blockchain-powered educational platform that rewards users for learning indigenous languages and cultures through NFT certificates and tokens on the Stellar network.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start with Docker](#quick-start-with-docker)
- [Development Setup](#development-setup)
- [Manual Setup](#manual-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## ✨ Features

- 🎓 Interactive language learning modules
- 🏆 Gamified learning with XP and streaks
- 🎖️ NFT certificates on Stellar blockchain
- 📊 Weekly leaderboards and rewards
- 📱 Mobile app (React Native)
- 🌐 Web application (React + Vite)
- 🔐 JWT authentication
- 🌍 Multi-language support

## 🛠 Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for database management
- **PostgreSQL** - Primary database
- **Redis** - Caching and rate limiting
- **Stellar SDK** - Blockchain integration
- **ACTA SDK** - Certificate generation

### Frontend

- **React 19** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Framer Motion** - Animations

### Mobile

- **React Native** - Cross-platform mobile
- **Expo** - Development framework

## 🚀 Quick Start with Docker

The fastest way to get the full stack running locally.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/tonalli.git
cd tonalli
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred settings
# For local development, the defaults work fine
nano .env  # or use your preferred editor
```

### 3. Start All Services

#### Development Mode (with hot-reload)

```bash
# Start all services with hot-reload enabled
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or run in detached mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

#### Production Mode

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

### 4. Access the Applications

Once all services are running:

- **Web App**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 5. Initialize Database (First Time Only)

```bash
# Run database migrations and seed data
docker-compose exec backend npm run seed
```

### 6. View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f web
docker-compose logs -f postgres
```

### 7. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

## 💻 Development Setup

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Rebuild a specific service
docker-compose build backend
docker-compose build web

# Execute commands in running containers
docker-compose exec backend npm run lint
docker-compose exec backend npm test
docker-compose exec web npm run build

# Access container shell
docker-compose exec backend sh
docker-compose exec postgres psql -U tonalli -d tonalli
```

### Hot Reload

In development mode, both backend and frontend support hot-reload:

- **Backend**: Changes to `.ts` files automatically restart the server
- **Frontend**: Changes to `.tsx/.ts` files trigger instant HMR updates

### Database Management

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U tonalli -d tonalli

# Backup database
docker-compose exec postgres pg_dump -U tonalli tonalli > backup.sql

# Restore database
docker-compose exec -T postgres psql -U tonalli tonalli < backup.sql

# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run seed
```

### Redis Management

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Clear all cache
docker-compose exec redis redis-cli FLUSHALL

# Monitor Redis commands
docker-compose exec redis redis-cli MONITOR
```

## 🔧 Manual Setup

If you prefer to run services locally without Docker:

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- npm or yarn

### Backend Setup

```bash
cd Services-Tonalli

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your local database credentials

# Run migrations
npm run migration:run

# Seed database
npm run seed

# Start development server
npm run start:dev
```

### Frontend Setup

```bash
cd Web-app-tonalli

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:3001/api

# Start development server
npm run dev
```

### Mobile Setup

```bash
cd Movil-tonalli

# Install dependencies
npm install

# Start Expo development server
npm start
```

## 📁 Project Structure

```
tonalli/
├── Services-Tonalli/          # NestJS Backend
│   ├── src/
│   │   ├── auth/             # Authentication module
│   │   ├── users/            # User management
│   │   ├── lessons/          # Lesson content
│   │   ├── chapters/         # Chapter management
│   │   ├── progress/         # User progress tracking
│   │   ├── certificates/     # NFT certificates
│   │   ├── stellar/          # Blockchain integration
│   │   └── podium/           # Leaderboard system
│   ├── contracts/            # Stellar smart contracts (Rust)
│   └── Dockerfile
│
├── Web-app-tonalli/          # React Web App
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # Zustand stores
│   │   └── services/         # API services
│   └── Dockerfile
│
├── Movil-tonalli/            # React Native Mobile App
│   ├── app/                  # Expo Router pages
│   ├── src/
│   │   ├── components/       # Mobile components
│   │   ├── store/            # State management
│   │   └── services/         # API integration
│   └── app.json
│
├── docker-compose.yml        # Production Docker setup
├── docker-compose.dev.yml    # Development overrides
└── .env.example              # Environment template
```

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register       # Register new user
POST /api/auth/login          # Login user
GET  /api/auth/profile        # Get current user profile
```

### Lessons & Chapters

```
GET  /api/chapters            # List all chapters
GET  /api/chapters/:id        # Get chapter details
GET  /api/lessons/:id         # Get lesson content
POST /api/progress            # Update user progress
```

### Certificates & Blockchain

```
GET  /api/certificates        # List user certificates
POST /api/certificates        # Generate NFT certificate
GET  /api/stellar/balance     # Get token balance
```

### Leaderboard

```
GET  /api/podium/weekly       # Get weekly leaderboard
GET  /api/podium/rewards      # Get available rewards
```

## 🔐 Environment Variables

Key environment variables (see `.env.example` for complete list):

| Variable          | Description         | Default                     |
| ----------------- | ------------------- | --------------------------- |
| `NODE_ENV`        | Environment mode    | `development`               |
| `BACKEND_PORT`    | Backend server port | `3001`                      |
| `DB_HOST`         | PostgreSQL host     | `postgres`                  |
| `DB_PORT`         | PostgreSQL port     | `5432`                      |
| `DB_USER`         | Database user       | `tonalli`                   |
| `DB_PASS`         | Database password   | `tonalli_password`          |
| `REDIS_HOST`      | Redis host          | `redis`                     |
| `JWT_SECRET`      | JWT signing secret  | ⚠️ Change in production     |
| `STELLAR_NETWORK` | Stellar network     | `testnet`                   |
| `VITE_API_URL`    | Frontend API URL    | `http://localhost:3001/api` |

## 🧪 Testing

```bash
# Backend tests
docker-compose exec backend npm test
docker-compose exec backend npm run test:e2e
docker-compose exec backend npm run test:cov

# Frontend tests
docker-compose exec web npm test
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3001
lsof -i :5173

# Change ports in .env file
BACKEND_PORT=3002
WEB_PORT=5174
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Clear Everything and Start Fresh

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild and start
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Smart Contract Example**: https://stellar.expert/explorer/testnet/tx/ec9c077dcf655ee67f191a979e019e3095142a37d4785d65921c494a189ed552
- **Stellar Network**: https://stellar.org
- **ACTA SDK**: https://acta.team

## 👥 Team

Built with ❤️ by the Tonalli team

---

**Need help?** Open an issue or contact us at support@tonalli.app
