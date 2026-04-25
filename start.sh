#!/bin/bash

# Tonalli Quick Start Script
# This script helps you get started with Tonalli development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print header
print_message "$BLUE" "
╔═══════════════════════════════════════╗
║   🌟 Tonalli Development Setup 🌟    ║
╚═══════════════════════════════════════╝
"

# Check prerequisites
print_message "$YELLOW" "📋 Checking prerequisites..."

if ! command_exists docker; then
    print_message "$RED" "❌ Docker is not installed. Please install Docker first."
    print_message "$BLUE" "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command_exists docker-compose; then
    print_message "$RED" "❌ Docker Compose is not installed. Please install Docker Compose first."
    print_message "$BLUE" "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

print_message "$GREEN" "✅ Docker and Docker Compose are installed"

# Check if .env exists
if [ ! -f .env ]; then
    print_message "$YELLOW" "⚙️  Creating .env file from template..."
    cp .env.example .env
    print_message "$GREEN" "✅ .env file created"
    print_message "$BLUE" "   You can edit .env to customize your configuration"
else
    print_message "$GREEN" "✅ .env file already exists"
fi

# Ask user which mode to run
print_message "$YELLOW" "
🚀 Choose your setup mode:
1) Development (with hot-reload) - Recommended for development
2) Production (optimized build) - For testing production setup
"

read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        print_message "$BLUE" "🔧 Starting in DEVELOPMENT mode..."
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
        MODE="development"
        ;;
    2)
        print_message "$BLUE" "🏭 Starting in PRODUCTION mode..."
        COMPOSE_FILES="-f docker-compose.yml"
        MODE="production"
        ;;
    *)
        print_message "$RED" "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

# Check if containers are already running
if docker-compose ps | grep -q "Up"; then
    print_message "$YELLOW" "⚠️  Some containers are already running."
    read -p "Do you want to stop them and restart? (y/n): " restart
    if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
        print_message "$BLUE" "🛑 Stopping existing containers..."
        docker-compose down
    else
        print_message "$BLUE" "Continuing with existing containers..."
    fi
fi

# Build and start containers
print_message "$BLUE" "🏗️  Building and starting containers..."
docker-compose $COMPOSE_FILES up --build -d

# Wait for services to be healthy
print_message "$YELLOW" "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
print_message "$BLUE" "🔍 Checking service health..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps | grep -q "postgres.*Up.*healthy" && \
       docker-compose ps | grep -q "redis.*Up.*healthy"; then
        print_message "$GREEN" "✅ All services are healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_message "$RED" "❌ Services failed to become healthy. Check logs with: docker-compose logs"
        exit 1
    fi
    
    sleep 2
done

# Ask if user wants to seed the database
print_message "$YELLOW" "
🌱 Do you want to seed the database with initial data?
   (Only needed on first run or after database reset)
"
read -p "Seed database? (y/n): " seed

if [ "$seed" = "y" ] || [ "$seed" = "Y" ]; then
    print_message "$BLUE" "🌱 Seeding database..."
    docker-compose exec -T backend npm run seed || print_message "$YELLOW" "⚠️  Seeding failed or already completed"
fi

# Print success message
print_message "$GREEN" "
╔═══════════════════════════════════════════════════════╗
║          🎉 Tonalli is now running! 🎉               ║
╚═══════════════════════════════════════════════════════╝

📱 Access your applications:
   • Web App:     http://localhost:5173
   • Backend API: http://localhost:3001/api
   • PostgreSQL:  localhost:5432
   • Redis:       localhost:6379

📊 Useful commands:
   • View logs:        docker-compose logs -f
   • Stop services:    docker-compose down
   • Restart:          docker-compose restart
   • Shell access:     docker-compose exec backend sh

📚 Documentation: See README.md for more details

Mode: $MODE
"

# Ask if user wants to view logs
read -p "Do you want to view the logs now? (y/n): " view_logs

if [ "$view_logs" = "y" ] || [ "$view_logs" = "Y" ]; then
    print_message "$BLUE" "📋 Showing logs (Press Ctrl+C to exit)..."
    docker-compose logs -f
fi
