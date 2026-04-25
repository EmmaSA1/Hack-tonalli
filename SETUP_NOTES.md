# Setup Notes for Docker Implementation

## Important: PostgreSQL Driver Installation

The backend currently has `mysql2` installed but needs the PostgreSQL driver for Docker setup.

### Required Action

Before building the Docker containers, install the PostgreSQL driver:

```bash
cd Services-Tonalli
npm install pg
```

Or add it to `package.json` dependencies:

```json
"dependencies": {
  "pg": "^8.11.3",
  ...
}
```

### Why Both Drivers?

The backend is now configured to support both PostgreSQL and MySQL:

- **PostgreSQL**: Recommended for Docker and production (better for concurrent writes)
- **MySQL**: Can still be used for local development if preferred

The database type is controlled by the `DB_TYPE` environment variable in `.env`:

- `DB_TYPE=postgres` (default for Docker)
- `DB_TYPE=mysql` (for MySQL users)

## Database Configuration

### For PostgreSQL (Docker - Default)

```bash
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USER=tonalli
DB_PASS=tonalli_password
DB_NAME=tonalli
```

### For MySQL (Local Development)

```bash
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=tonalli
```

## First Time Setup Checklist

1. **Install PostgreSQL driver**:

   ```bash
   cd Services-Tonalli
   npm install pg
   ```

2. **Copy environment file**:

   ```bash
   cp .env.example .env
   ```

3. **Review and update .env** (optional):
   - Change `JWT_SECRET` for production
   - Change `DB_PASS` for production
   - Adjust ports if needed

4. **Start Docker services**:

   ```bash
   ./start.sh
   # or
   make dev
   # or
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

5. **Seed the database** (first time only):
   ```bash
   make seed
   # or
   docker-compose exec backend npm run seed
   ```

## Verification

After starting the services, verify everything is working:

```bash
# Check service status
docker-compose ps

# Check backend health
curl http://localhost:3001/api/health

# Check web app
curl http://localhost:5173/health

# View logs
make logs
```

## Troubleshooting

### Backend fails to start with database error

**Symptom**: Backend container keeps restarting, logs show database connection error

**Solution**:

1. Ensure PostgreSQL driver is installed: `npm install pg`
2. Rebuild the backend container: `docker-compose build backend`
3. Restart services: `docker-compose up -d`

### Port conflicts

**Symptom**: Error binding to port

**Solution**: Change ports in `.env`:

```bash
BACKEND_PORT=3002
WEB_PORT=5174
DB_PORT=5433
REDIS_PORT=6380
```

### Database connection refused

**Symptom**: Backend can't connect to PostgreSQL

**Solution**:

1. Check if PostgreSQL is running: `docker-compose ps postgres`
2. Check PostgreSQL logs: `docker-compose logs postgres`
3. Restart PostgreSQL: `docker-compose restart postgres`
4. Wait for health check: `docker-compose ps` (should show "healthy")

## Migration from MySQL to PostgreSQL

If you have existing data in MySQL and want to migrate:

1. **Export MySQL data**:

   ```bash
   mysqldump -u root -p tonalli > mysql_backup.sql
   ```

2. **Convert MySQL dump to PostgreSQL** (use a tool like `mysql2postgres` or manually adjust)

3. **Import to PostgreSQL**:
   ```bash
   docker-compose exec -T postgres psql -U tonalli tonalli < postgres_backup.sql
   ```

Alternatively, use a migration tool like [pgloader](https://pgloader.io/).

## Development Workflow

### Using PostgreSQL (Docker)

```bash
# Start services
make dev

# Make code changes (hot-reload enabled)

# View logs
make logs-backend

# Access database
make shell-db

# Stop services
make down
```

### Using MySQL (Local)

```bash
# Update .env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306

# Start only Redis (if needed)
docker-compose up -d redis

# Run backend locally
cd Services-Tonalli
npm run start:dev

# Run frontend locally
cd Web-app-tonalli
npm run dev
```

## Production Considerations

### PostgreSQL vs MySQL

**PostgreSQL Advantages** (Recommended):

- Better handling of concurrent writes
- More robust transaction support
- Better JSON support
- More advanced features (arrays, JSONB, etc.)
- Better for complex queries

**MySQL Advantages**:

- Slightly faster for simple read operations
- More familiar to some developers
- Simpler replication setup

### Recommendation

Use **PostgreSQL** for:

- Production deployments
- Docker environments
- Applications with complex data relationships
- High concurrency requirements

Use **MySQL** for:

- Legacy compatibility
- Simple applications
- When team is more familiar with MySQL

## Additional Resources

- [TypeORM PostgreSQL Documentation](https://typeorm.io/#/connection-options/postgres-connection-options)
- [TypeORM MySQL Documentation](https://typeorm.io/#/connection-options/mysql-connection-options)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)

## Support

If you encounter issues:

1. Check this document
2. Review `DOCKER.md` troubleshooting section
3. Check logs: `make logs`
4. Open a GitHub issue with:
   - Error message
   - Docker logs
   - Environment configuration (without secrets)
   - Steps to reproduce
