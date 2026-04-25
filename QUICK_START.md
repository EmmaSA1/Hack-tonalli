# 🚀 Tonalli Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- 4GB+ RAM available
- 5GB+ disk space

## 1. Clone & Setup

```bash
git clone <repository-url>
cd tonalli
cp .env.example .env
```

## 2. Start Everything

### Option A: Interactive Script (Easiest)

```bash
./start.sh
```

### Option B: Make Commands

```bash
make dev          # Development mode with hot-reload
make prod         # Production mode
```

### Option C: Docker Compose

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose up --build
```

## 3. Access Applications

- **Web App**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Health**: http://localhost:3001/api/health

## 4. Seed Database (First Time)

```bash
make seed
# or
docker-compose exec backend npm run seed
```

## Common Commands

### Viewing Logs

```bash
make logs              # All services
make logs-backend      # Backend only
make logs-web          # Frontend only
```

### Stopping Services

```bash
make down              # Stop all
docker-compose down    # Alternative
```

### Restarting

```bash
make restart           # Restart all
make restart-backend   # Restart backend only
```

### Database

```bash
make shell-db          # Access PostgreSQL
make backup            # Backup database
make db-reset          # Reset database (⚠️ deletes data)
```

### Shell Access

```bash
make shell-backend     # Backend container
make shell-web         # Web container
make shell-redis       # Redis CLI
```

### Testing

```bash
make test              # Run tests
make test-cov          # With coverage
```

### Cleanup

```bash
make clean             # Remove containers & volumes
make clean-all         # Remove everything including images
```

## Troubleshooting

### Port Already in Use

```bash
# Change ports in .env
BACKEND_PORT=3002
WEB_PORT=5174
```

### Service Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>
```

### Database Issues

```bash
# Check PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Reset database
make db-reset
```

### Clear Everything

```bash
# Nuclear option - removes everything
docker-compose down -v --rmi all
```

## Development Workflow

1. **Start services**: `make dev`
2. **Make changes**: Edit code in `Services-Tonalli/` or `Web-app-tonalli/`
3. **See changes**: Auto-reload happens automatically
4. **View logs**: `make logs`
5. **Stop services**: `make down`

## Production Checklist

Before deploying:

- [ ] Change `JWT_SECRET` in `.env`
- [ ] Change `DB_PASS` in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS
- [ ] Configure backups
- [ ] Set up monitoring

## Need Help?

- **Full Documentation**: See `README.md`
- **Docker Guide**: See `DOCKER.md`
- **Make Commands**: Run `make help`
- **Issues**: Open a GitHub issue

## Quick Reference Card

| Task          | Command              |
| ------------- | -------------------- |
| Start dev     | `make dev`           |
| Start prod    | `make prod`          |
| Stop all      | `make down`          |
| View logs     | `make logs`          |
| Seed DB       | `make seed`          |
| Reset DB      | `make db-reset`      |
| Backend shell | `make shell-backend` |
| DB shell      | `make shell-db`      |
| Run tests     | `make test`          |
| Clean up      | `make clean`         |

---

**That's it! You're ready to develop with Tonalli! 🌟**
