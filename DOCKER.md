# 🐳 Docker Setup Guide for Tonalli

This guide provides detailed information about running Tonalli using Docker and Docker Compose.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Architecture Overview

The Tonalli Docker setup consists of four main services:

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │   Web    │───▶│  Backend │───▶│ Postgres │         │
│  │  :5173   │    │  :3001   │    │  :5432   │         │
│  └──────────┘    └──────────┘    └──────────┘         │
│                        │                                 │
│                        ▼                                 │
│                   ┌──────────┐                          │
│                   │  Redis   │                          │
│                   │  :6379   │                          │
│                   └──────────┘                          │
└─────────────────────────────────────────────────────────┘
```

### Services

1. **PostgreSQL** - Primary database for storing user data, lessons, progress
2. **Redis** - Caching layer and rate limiting
3. **Backend** - NestJS API server
4. **Web** - React + Vite frontend application

## Prerequisites

### Required Software

- **Docker**: Version 20.10 or higher
  - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Version 2.0 or higher
  - [Install Docker Compose](https://docs.docker.com/compose/install/)

### System Requirements

- **RAM**: Minimum 4GB, recommended 8GB
- **Disk Space**: At least 5GB free space
- **CPU**: 2+ cores recommended

### Verify Installation

```bash
docker --version
# Docker version 20.10.x or higher

docker-compose --version
# Docker Compose version v2.x.x or higher
```

## Quick Start

### Method 1: Using the Start Script (Recommended)

```bash
# Make the script executable (first time only)
chmod +x start.sh

# Run the interactive setup
./start.sh
```

The script will:

- Check prerequisites
- Create `.env` file if needed
- Let you choose development or production mode
- Start all services
- Optionally seed the database
- Show you how to access the applications

### Method 2: Using Make Commands

```bash
# Setup environment (first time only)
make setup

# Start development environment
make dev

# Or start in background
make dev-bg

# View logs
make logs
```

### Method 3: Using Docker Compose Directly

```bash
# Copy environment file
cp .env.example .env

# Start development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or start production mode
docker-compose up --build
```

## Configuration

### Environment Variables

The `.env` file controls all configuration. Key variables:

#### Application Settings

```bash
NODE_ENV=development          # development | production | test
BACKEND_PORT=3001            # Backend API port
WEB_PORT=5173                # Frontend port
```

#### Database Configuration

```bash
DB_HOST=postgres             # Use 'postgres' for Docker, 'localhost' for local
DB_PORT=5432
DB_USER=tonalli
DB_PASS=tonalli_password     # ⚠️ Change in production!
DB_NAME=tonalli
```

#### Redis Configuration

```bash
REDIS_HOST=redis             # Use 'redis' for Docker, 'localhost' for local
REDIS_PORT=6379
```

#### Security

```bash
JWT_SECRET=your-secret-key   # ⚠️ Generate strong secret for production!
JWT_EXPIRES_IN=7d
```

#### Blockchain

```bash
STELLAR_NETWORK=testnet      # testnet | mainnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### Generating Secure Secrets

```bash
# Generate a secure JWT secret
openssl rand -base64 64

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Development Workflow

### Starting Development Environment

```bash
# Start with hot-reload enabled
make dev

# Or using docker-compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

In development mode:

- ✅ Hot-reload enabled for backend and frontend
- ✅ Source code mounted as volumes
- ✅ Detailed logging
- ✅ Debug ports exposed

### Making Code Changes

1. **Backend Changes** (TypeScript)
   - Edit files in `Services-Tonalli/src/`
   - Server automatically restarts
   - Check logs: `make logs-backend`

2. **Frontend Changes** (React)
   - Edit files in `Web-app-tonalli/src/`
   - Browser automatically refreshes (HMR)
   - Check logs: `make logs-web`

### Running Commands in Containers

```bash
# Backend commands
docker-compose exec backend npm run lint
docker-compose exec backend npm test
docker-compose exec backend npm run seed

# Frontend commands
docker-compose exec web npm run build
docker-compose exec web npm run lint

# Database commands
docker-compose exec postgres psql -U tonalli -d tonalli

# Redis commands
docker-compose exec redis redis-cli
```

### Accessing Container Shells

```bash
# Backend shell
make shell-backend
# or
docker-compose exec backend sh

# Database shell
make shell-db
# or
docker-compose exec postgres psql -U tonalli -d tonalli

# Redis CLI
make shell-redis
# or
docker-compose exec redis redis-cli
```

### Database Management

#### Seeding Data

```bash
# Seed initial data
make seed

# Or manually
docker-compose exec backend npm run seed
```

#### Backup Database

```bash
# Using Makefile
make backup

# Or manually
docker-compose exec postgres pg_dump -U tonalli tonalli > backup.sql
```

#### Restore Database

```bash
# Using Makefile
make restore

# Or manually
docker-compose exec -T postgres psql -U tonalli tonalli < backup.sql
```

#### Reset Database

```bash
# ⚠️ This deletes all data!
make db-reset

# Or manually
docker-compose down -v
docker-compose up -d postgres
sleep 5
docker-compose exec backend npm run seed
```

### Viewing Logs

```bash
# All services
make logs

# Specific service
make logs-backend
make logs-web
make logs-db

# Or using docker-compose
docker-compose logs -f backend
docker-compose logs -f web --tail=100
```

### Stopping Services

```bash
# Stop all services
make down

# Or
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## Production Deployment

### Building for Production

```bash
# Build production images
docker-compose build

# Start production environment
make prod

# Or in background
make prod-bg
```

### Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `DB_PASS` to a strong password
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Review security headers
- [ ] Configure rate limiting
- [ ] Set up health checks

### Production Environment Variables

```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DB_PASS=<strong-database-password>
CORS_ORIGIN=https://yourdomain.com
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
```

### Health Checks

```bash
# Check service health
make health

# Or manually
curl http://localhost:3001/api/health
curl http://localhost:5173/health
```

### Monitoring

```bash
# View resource usage
make stats

# Or
docker stats

# Check service status
make status

# Or
docker-compose ps
```

## Troubleshooting

### Common Issues

#### Port Already in Use

**Problem**: Error binding to port 3001, 5173, 5432, or 6379

**Solution**:

```bash
# Find what's using the port
lsof -i :3001
lsof -i :5173

# Kill the process or change port in .env
BACKEND_PORT=3002
WEB_PORT=5174
```

#### Database Connection Failed

**Problem**: Backend can't connect to PostgreSQL

**Solution**:

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check if database exists
docker-compose exec postgres psql -U tonalli -l
```

#### Redis Connection Failed

**Problem**: Backend can't connect to Redis

**Solution**:

```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

#### Container Keeps Restarting

**Problem**: Service container restarts continuously

**Solution**:

```bash
# View container logs
docker-compose logs backend

# Check for errors in the code
# Fix the issue and rebuild
docker-compose build backend
docker-compose up -d backend
```

#### Out of Disk Space

**Problem**: Docker runs out of disk space

**Solution**:

```bash
# Remove unused containers, networks, images
docker system prune

# Remove unused volumes (⚠️ may delete data)
docker system prune -a --volumes

# Check disk usage
docker system df
```

#### Hot Reload Not Working

**Problem**: Changes not reflected in development mode

**Solution**:

```bash
# Ensure you're using dev compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Check if volumes are mounted correctly
docker-compose exec backend ls -la /app/src

# Restart the service
docker-compose restart backend
```

### Debugging Tips

#### Enable Verbose Logging

```bash
# Backend
docker-compose exec backend npm run start:debug

# View detailed logs
docker-compose logs -f backend --tail=1000
```

#### Access Container Filesystem

```bash
# List files in backend container
docker-compose exec backend ls -la /app

# Check environment variables
docker-compose exec backend env

# Check network connectivity
docker-compose exec backend ping postgres
docker-compose exec backend ping redis
```

#### Network Issues

```bash
# List Docker networks
docker network ls

# Inspect network
docker network inspect tonalli_tonalli-network

# Test connectivity between services
docker-compose exec backend ping postgres
docker-compose exec backend nc -zv postgres 5432
```

## Advanced Usage

### Custom Docker Compose Files

Create custom overrides for specific environments:

```bash
# docker-compose.staging.yml
version: '3.8'
services:
  backend:
    environment:
      NODE_ENV: staging
      LOG_LEVEL: debug
```

Use it:

```bash
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up
```

### Scaling Services

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Note: You'll need a load balancer for this to work properly
```

### Building Specific Services

```bash
# Build only backend
docker-compose build backend

# Build with no cache
docker-compose build --no-cache backend

# Build with build arguments
docker-compose build --build-arg NODE_ENV=production backend
```

### Using Docker Compose Profiles

Add profiles to services in `docker-compose.yml`:

```yaml
services:
  debug-tools:
    image: nicolaka/netshoot
    profiles: ["debug"]
```

Run with profile:

```bash
docker-compose --profile debug up
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect tonalli_postgres_data

# Backup volume
docker run --rm -v tonalli_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v tonalli_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

### Multi-Stage Builds

The Dockerfiles use multi-stage builds for optimization:

- **deps**: Install production dependencies
- **builder**: Build the application
- **runner**: Final production image

This results in smaller, more secure images.

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Docker Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build images
        run: docker-compose build
      - name: Run tests
        run: docker-compose run backend npm test
```

## Performance Optimization

### Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

### Caching Strategies

- Use `.dockerignore` to exclude unnecessary files
- Leverage Docker layer caching
- Use multi-stage builds
- Cache npm dependencies

### Database Performance

```bash
# Tune PostgreSQL settings
docker-compose exec postgres psql -U tonalli -d tonalli
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong passwords** - Generate random secrets
3. **Run as non-root user** - Dockerfiles include non-root users
4. **Keep images updated** - Regularly update base images
5. **Scan for vulnerabilities** - Use `docker scan`
6. **Limit network exposure** - Only expose necessary ports
7. **Use secrets management** - For production, use Docker secrets

```bash
# Scan image for vulnerabilities
docker scan tonalli-backend:latest
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [Vite Docker Guide](https://vitejs.dev/guide/static-deploy.html)

## Getting Help

If you encounter issues:

1. Check the logs: `make logs`
2. Review this troubleshooting guide
3. Check Docker status: `docker-compose ps`
4. Open an issue on GitHub
5. Contact the team at support@tonalli.app

---

**Happy Dockering! 🐳**
