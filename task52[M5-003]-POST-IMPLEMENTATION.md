# Task 52 [M5-003]: Response Caching with Redis - Post Implementation

## Summary

Implemented Redis caching for GET /api/chapters and leaderboard endpoints to reduce expensive computations.

---

## What Was Done

### 1. Dependencies Installed
```bash
npm install cache-manager @nestjs/cache-manager redis cache-manager-redis-store
```

### 2. Files Created

| File | Purpose |
|------|---------|
| `src/cache/cache.constants.ts` | Cache keys and TTL constants |
| `src/cache/cache.module.ts` | Redis configuration (optional) |

### 3. Files Modified

| File | Changes |
|------|---------|
| `src/app.module.ts` | Added `CacheModule.register()` |
| `src/chapters/chapters.controller.ts` | Added `CacheInterceptor` to `GET /api/chapters` |
| `src/chapters/chapters.service.ts` | Added cache invalidation on write operations |
| `src/podium/podium.controller.ts` | Added `CacheInterceptor` to `GET /api/podium/global` |
| `src/podium/podium.service.ts` | Added cache invalidation on reward distribution |
| `src/acta/acta.service.ts` | Added manual cache to credential methods |

### 4. Cache Configuration

| Endpoint | Cache Key | TTL |
|----------|-----------|-----|
| GET /api/chapters | `chapters:list` | 5 min (300s) |
| GET /api/podium/global | `podium:global` | 2 min (120s) |
| verifyCredential() | `certificate:{vcId}` | 10 min (600s) |

### 5. Invalidation Triggers

**Chapters** (invalidates on any change):
- `create()` - new chapter published
- `update()` - chapter updated
- `remove()` - chapter deleted
- `togglePublish()` - publish status changed
- `setReleaseWeek()` - release week changed

**Leaderboard** (invalidates on reward distribution):
- `distributeWeeklyRewards()` - weekly rewards distributed

---

## How to Test

### Run Tests
```bash
cd Services-Tonalli
npm test
```

**Expected output:**
```
Test Suites: 4 passed, 4 total
Tests:       17 passed, 17 total
```

### Manual Testing

1. **Start the server:**
```bash
npm run start:dev
```

2. **Test chapters cache:**
```bash
# First call - hits DB
curl http://localhost:3001/api/chapters -H "Authorization: Bearer <token>"

# Second call - returns cached (faster)
curl http://localhost:3001/api/chapters -H "Authorization: Bearer <token>"
```

3. **Test cache invalidation:**
```bash
# Create new chapter - should invalidate cache
curl -X POST http://localhost:3001/api/chapters \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chapter", "description": "Test"}'

# Next GET call - fetches fresh data from DB
curl http://localhost:3001/api/chapters -H "Authorization: Bearer <token>"
```

4. **Test leaderboard cache:**
```bash
# First call - hits DB
curl http://localhost:3001/api/podium/global -H "Authorization: Bearer <token>"

# Second call - returns cached (faster)
curl http://localhost:3001/api/podium/global -H "Authorization: Bearer <token>"
```

### Verify with Redis (Optional)

If using Redis, verify with CLI:
```bash
redis-cli
> KEYS *
> GET chapters:list
> GET podium:global
```

If not using Redis, the default in-memory cache works automatically.

---

## Environment Variables

To use Redis in production, add `.env`:
```env
REDIS_URL=redis://localhost:6379
```

If not set, falls back to in-memory cache.

---

## Logs to Watch

When cache operations occur, you'll see:
```
[Cache] Chapters cache invalidated
[Cache] Leaderboard cache invalidated
```

---

## Notes

- Cache TTL is in milliseconds in code, but decorator uses seconds
- Default TTL is 300s (5 min) if no override specified
- Invalidations are non-blocking (fail gracefully)
- All tests pass - see test files:
  - `src/chapters/chapters.controller.spec.ts`
  - `src/chapters/chapters.service.spec.ts`
  - `src/podium/podium.controller.spec.ts`