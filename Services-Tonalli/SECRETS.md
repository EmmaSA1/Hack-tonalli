# Secrets Management & Key Rotation

## Overview

Tonalli uses **AWS Secrets Manager** in production to store all sensitive credentials. Plain environment variables are only used for local development.

## Secrets stored in AWS Secrets Manager

Secret name: `tonalli/production` (configurable via `AWS_SECRET_NAME`)

| Key | Description |
|-----|-------------|
| `STELLAR_ADMIN_SECRET` | Stellar admin keypair secret — signs ACTA credentials |
| `REWARD_POOL_SECRET` | Stellar reward pool keypair secret — sends XLM rewards |
| `JWT_SECRET` | JWT signing secret |
| `ACTA_API_KEY` | ACTA API authentication key |

## Enabling AWS Secrets Manager

Set these in your deployment environment (not in `.env`):

```
USE_AWS_SECRETS=true
AWS_REGION=us-east-1
AWS_SECRET_NAME=tonalli/production   # optional, this is the default
```

In production, attach an IAM role to the EC2/ECS task with `secretsmanager:GetSecretValue` on the secret ARN. The service uses the default AWS credential chain.

## Creating / updating the secret

```bash
# Create
aws secretsmanager create-secret \
  --name tonalli/production \
  --secret-string '{
    "STELLAR_ADMIN_SECRET": "S...",
    "REWARD_POOL_SECRET": "S...",
    "JWT_SECRET": "...",
    "ACTA_API_KEY": "..."
  }'

# Update a single key
CURRENT=$(aws secretsmanager get-secret-value --secret-id tonalli/production | jq -r '.SecretString')
UPDATED=$(echo $CURRENT | jq '.STELLAR_ADMIN_SECRET = "NEW_SECRET_HERE"')
aws secretsmanager put-secret-value --secret-id tonalli/production --secret-string "$UPDATED"
```

## Key Rotation Process

### Stellar Admin / Reward Pool Keys

1. Generate a new keypair:
   ```bash
   node -e "const sdk=require('@stellar/stellar-sdk'); const kp=sdk.Keypair.random(); console.log(kp.publicKey(), kp.secret())"
   ```
2. Fund the new account (testnet: Friendbot; mainnet: transfer XLM from old account).
3. Update the key in AWS Secrets Manager (see above).
4. Restart the service — `SecretsService.onModuleInit` fetches the new value on startup.
5. Decommission the old account.

### JWT Secret

1. Generate: `openssl rand -hex 32`
2. Update `JWT_SECRET` in AWS Secrets Manager.
3. Restart the service. Existing tokens are invalidated — users must log in again.

### ACTA API Key

1. Rotate in the ACTA dashboard.
2. Update `ACTA_API_KEY` in AWS Secrets Manager.
3. Restart the service.

## Audit Logs

Every `SecretsService.get(key)` call emits:

```
[Secrets] [AUDIT] Secret accessed: STELLAR_ADMIN_SECRET
```

Ship these logs to CloudWatch Logs / your SIEM and set a metric filter on `[AUDIT]` to alert on unexpected access patterns.

## Local Development

Leave `USE_AWS_SECRETS` unset. The service falls back to `.env`:

```env
STELLAR_ADMIN_SECRET=S...
REWARD_POOL_SECRET=S...
JWT_SECRET=local_dev_secret
ACTA_API_KEY=...
```

`.env` is git-ignored. Never commit real secrets.
