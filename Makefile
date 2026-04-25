.PHONY: help dev prod up down build logs clean restart seed shell-backend shell-web shell-db test

# Default target
help:
	@echo "🌟 Tonalli Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev          - Start development environment (hot-reload)"
	@echo "  make prod         - Start production environment"
	@echo "  make down         - Stop all services"
	@echo ""
	@echo "Development:"
	@echo "  make logs         - View all logs"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-web     - View web logs"
	@echo "  make restart      - Restart all services"
	@echo "  make build        - Rebuild all containers"
	@echo ""
	@echo "Database:"
	@echo "  make seed         - Seed database with initial data"
	@echo "  make db-reset     - Reset database (⚠️  deletes all data)"
	@echo "  make shell-db     - Access PostgreSQL shell"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-backend - Access backend container shell"
	@echo "  make shell-web     - Access web container shell"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run backend tests"
	@echo "  make test-e2e     - Run end-to-end tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Stop and remove all containers and volumes"
	@echo "  make clean-all    - Remove everything including images"

# Development mode with hot-reload
dev:
	@echo "🔧 Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Development mode in background
dev-bg:
	@echo "🔧 Starting development environment in background..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Services started! View logs with: make logs"

# Production mode
prod:
	@echo "🏭 Starting production environment..."
	docker-compose up --build

# Production mode in background
prod-bg:
	@echo "🏭 Starting production environment in background..."
	docker-compose up --build -d
	@echo "✅ Services started! View logs with: make logs"

# Start services (alias for dev)
up: dev-bg

# Stop all services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

# Build all containers
build:
	@echo "🏗️  Building all containers..."
	docker-compose build

# Build specific service
build-backend:
	@echo "🏗️  Building backend..."
	docker-compose build backend

build-web:
	@echo "🏗️  Building web..."
	docker-compose build web

# View all logs
logs:
	docker-compose logs -f

# View backend logs
logs-backend:
	docker-compose logs -f backend

# View web logs
logs-web:
	docker-compose logs -f web

# View database logs
logs-db:
	docker-compose logs -f postgres

# Restart all services
restart:
	@echo "🔄 Restarting all services..."
	docker-compose restart

# Restart specific service
restart-backend:
	docker-compose restart backend

restart-web:
	docker-compose restart web

# Seed database
seed:
	@echo "🌱 Seeding database..."
	docker-compose exec backend npm run seed

# Reset database (dangerous!)
db-reset:
	@echo "⚠️  This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker-compose up -d postgres redis; \
		sleep 5; \
		docker-compose up -d backend; \
		sleep 5; \
		docker-compose exec backend npm run seed; \
	fi

# Access backend shell
shell-backend:
	docker-compose exec backend sh

# Access web shell
shell-web:
	docker-compose exec web sh

# Access database shell
shell-db:
	docker-compose exec postgres psql -U tonalli -d tonalli

# Access Redis CLI
shell-redis:
	docker-compose exec redis redis-cli

# Run backend tests
test:
	docker-compose exec backend npm test

# Run backend tests with coverage
test-cov:
	docker-compose exec backend npm run test:cov

# Run end-to-end tests
test-e2e:
	docker-compose exec backend npm run test:e2e

# Lint backend code
lint-backend:
	docker-compose exec backend npm run lint

# Format backend code
format-backend:
	docker-compose exec backend npm run format

# Check service status
status:
	docker-compose ps

# Clean up containers and volumes
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose down -v

# Clean up everything including images
clean-all:
	@echo "🧹 Cleaning up everything..."
	docker-compose down -v --rmi all

# Show container resource usage
stats:
	docker stats

# Create .env from example if it doesn't exist
setup:
	@if [ ! -f .env ]; then \
		echo "⚙️  Creating .env file..."; \
		cp .env.example .env; \
		echo "✅ .env file created. Please edit it with your configuration."; \
	else \
		echo "✅ .env file already exists"; \
	fi

# Health check
health:
	@echo "🏥 Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "Backend API:"
	@curl -s http://localhost:3001/api/health || echo "❌ Backend not responding"
	@echo ""
	@echo "Web App:"
	@curl -s http://localhost:5173/health || echo "❌ Web not responding"

# Backup database
backup:
	@echo "💾 Backing up database..."
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U tonalli tonalli > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in backups/"

# Restore database from backup
restore:
	@echo "📥 Available backups:"
	@ls -1 backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " backup; \
	if [ -f "backups/$$backup" ]; then \
		docker-compose exec -T postgres psql -U tonalli tonalli < "backups/$$backup"; \
		echo "✅ Database restored"; \
	else \
		echo "❌ Backup file not found"; \
	fi
