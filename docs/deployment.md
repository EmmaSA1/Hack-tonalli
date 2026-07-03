# Staging Deployment

This repository uses a production-grade GitHub Actions workflow to deploy both the backend and frontend to a staging environment connected to Stellar testnet.

## Workflow

- File: `.github/workflows/deploy-staging.yml`
- Trigger: `push` to `main`
- Jobs:
  - `build-and-test`
  - `deploy-backend`
  - `deploy-frontend`
  - `health-check`
  - `notify-on-failure`

## Backend deployment targets

The workflow supports both deploy targets:

- Railway via `RAILWAY_TOKEN` / `RAILWAY_SERVICE_ID`
- Render via `RENDER_API_KEY` / `RENDER_SERVICE_ID`

Only one backend provider needs to be configured for the workflow to proceed.

## Required GitHub Secrets

The workflow depends on these secrets:

- `RAILWAY_TOKEN` or `RENDER_API_KEY`
- `RAILWAY_SERVICE_ID` or `RENDER_SERVICE_ID`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `STELLAR_NETWORK`
- `STELLAR_RPC_URL`
- `STELLAR_HORIZON_URL`
- `STELLAR_SOROBAN_URL`
- `ACTA_API_KEY`
- `ACTA_BASE_URL`
- `STELLAR_ADMIN_SECRET`
- `REWARD_POOL_SECRET`
- `JWT_SECRET`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `STAGING_API_URL`

Optional notification secrets:

- `SLACK_WEBHOOK_URL`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `SENDGRID_TO_EMAIL`

## Notes

- The backend health check validates `GET /api/health` against the staging host.
- The frontend deploy passes `VITE_API_URL=${STAGING_API_URL}` into Vercel build environment.
- No plaintext secrets are stored in the workflow file.
