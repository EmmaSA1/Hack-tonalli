# Tonalli - Learn to Earn Platform

A full-stack Learn to Earn platform built with NestJS, React, and Stellar blockchain integration.

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- Git

### Getting Started

1. **Clone the repository**

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start the full stack**
   ```bash
   docker-compose up -d
   ```

4. **Access the services**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api
   - MySQL: localhost:3306
   - Redis: localhost:6379

### Useful Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

## Development without Docker

### Backend (NestJS)

```bash
cd Services-Tonalli
npm install
# Configure .env file with your database credentials
npm run start:dev
```

### Frontend (React + Vite)

```bash
cd Web-app-tonalli
npm install
# Configure .env file
npm run dev
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` - Database configuration
- `ACTA_API_KEY` - ACTA SDK API key (get at https://dapp.acta.build)
- `ACTA_NETWORK` - Network for ACTA (testnet/futurenet)
- `JWT_SECRET` - Secret key for JWT tokens

## Services

- **MySQL** (port 3306) - Main database
- **Redis** (port 6379) - Cache and throttler (future use)
- **Backend** (port 3001) - NestJS API with hot-reload
- **Web** (port 5173) - React frontend with hot-reload