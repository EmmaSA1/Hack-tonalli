# Tonalli — Mainnet Rollback Plan

## Scope

This document covers rollback procedures for the Tonalli production deployment on Stellar Mainnet (Soroban contracts + NestJS backend).

---

## 1. What Can and Cannot Be Rolled Back

| Component | Rollback Possible? | Notes |
|---|---|---|
| NestJS backend | Yes | Redeploy previous Docker image / git tag |
| MySQL database | Yes (with backup) | Restore from pre-deploy snapshot |
| Soroban contracts | No (immutable) | State is permanent on-chain |
| XLM transfers | No | Blockchain transactions are final |
| NFT mints | No | On-chain records are permanent |

> Smart contracts on Stellar are immutable once deployed. Rollback means deploying a new fixed contract and migrating the admin pointer — not reverting the old one.

---

## 2. Pre-Deploy Snapshot Checklist

Before every mainnet deployment:

- [ ] MySQL full backup: `mysqldump -u root -p tonalli > tonalli_backup_$(date +%Y%m%d_%H%M%S).sql`
- [ ] Record current git SHA: `git rev-parse HEAD > DEPLOY_SHA.txt`
- [ ] Record current contract IDs from `.env.contracts.mainnet`
- [ ] Record admin public key and confirm HSM/KMS access
- [ ] Confirm reward pool balance before and after

---

## 3. Backend Rollback

### Step 1 — Identify the last stable release
```bash
git log --oneline -10
```

### Step 2 — Redeploy previous version
```bash
# If using Docker
docker pull tonalli/backend:<previous-tag>
docker stop tonalli-backend
docker run -d --env-file .env.production tonalli/backend:<previous-tag>

# If deploying directly
git checkout <previous-sha>
npm run build
npm run start:prod
```

### Step 3 — Verify health
```bash
curl https://api.tonalli.app/api/health
```

---

## 4. Database Rollback

### Restore from backup
```bash
mysql -u root -p tonalli < tonalli_backup_<timestamp>.sql
```

> Only restore if the new schema migration caused data corruption. If the backend rollback is sufficient, skip DB restore.

---

## 5. Smart Contract Rollback (Contract Bug Found Post-Deploy)

Since contracts are immutable, the procedure is:

### Step 1 — Pause new on-chain operations
- Set `NFT_CONTRACT_ID`, `REWARDS_CONTRACT_ID`, `PODIUM_NFT_CONTRACT_ID` to empty in `.env.production`
- Restart backend — it will log warnings but not crash (mock mode activates for non-mainnet; on mainnet it throws, so set a `CONTRACT_PAUSED=true` flag)
- Alternatively, point the backend to a "paused" contract that rejects all calls

### Step 2 — Deploy fixed contracts
```bash
# Fix the Rust contract code, then:
DEPLOY_ENV=mainnet ADMIN_SECRET=$(vault kv get ...) \
  INITIAL_POOL_XLM=<amount> \
  ./contracts/deploy.sh
```

### Step 3 — Migrate admin pointer
- Update `.env.production` with new contract IDs
- Restart backend

### Step 4 — Communicate to users
- Any XLM already distributed is permanent and valid
- New certificates will be issued from the new contract
- Old certificates remain valid on-chain at the old contract address

---

## 6. Emergency Contacts

| Role | Responsibility |
|---|---|
| Backend Lead | NestJS + DB rollback |
| Blockchain Lead | Contract re-deploy + admin key access |
| DevOps | Infrastructure, Docker, env vars |

---

## 7. Reward Pool Emergency Withdrawal

If the reward pool needs to be drained urgently (e.g., contract bug):

```bash
stellar contract invoke \
  --id $REWARDS_CONTRACT_ID \
  --source tonalli-admin \
  --network mainnet \
  -- withdraw \
  --to $ADMIN_PUBLIC \
  --amount <pool_balance_in_stroops>
```

> Only the admin keypair (from HSM/KMS) can call `withdraw`.

---

## 8. Post-Incident

- Document what went wrong in `INCIDENT_LOG.md`
- Update this rollback plan with lessons learned
- Re-run full test suite before next deploy
