# Key Rotation Process

This document covers how to rotate the three secrets that Tonalli fetches from HashiCorp Vault.

## Vault paths

| Purpose | Path | Field |
|---|---|---|
| AES-256 master encryption key | `secret/data/tonalli/master-key` | `masterKey` |
| Stellar admin/reward-pool key | `secret/data/tonalli/admin-stellar` | `secretKey` |
| JWT signing secret | `secret/data/tonalli/jwt-secret` | `value` |

---

## 1. Rotating the JWT Secret

A new JWT secret invalidates all existing user sessions; users will be asked to log in again.

```bash
# 1. Generate a new secret
NEW_JWT_SECRET=$(openssl rand -hex 32)

# 2. Write the new version to Vault (KV v2 creates a new version automatically)
vault kv put secret/tonalli/jwt-secret value="$NEW_JWT_SECRET"

# 3. Invalidate the in-memory cache so the app picks up the new value
#    Restart the service or call the internal cache-invalidation endpoint (if deployed).
#    For a rolling restart: restart one pod/instance at a time to avoid downtime.

# 4. Verify the new secret is active
vault kv get secret/tonalli/jwt-secret
```

**Impact:** All sessions signed with the old secret become invalid immediately on restart.

---

## 2. Rotating the Stellar Admin Secret Key

Rotating the admin key means moving funds to a new Stellar account.

```bash
# 1. Create a new Stellar keypair (use the Stellar CLI, Freighter, or any SDK)
#    Keep the new secret key offline until step 3.

# 2. Fund the new account on mainnet (transfer XLM from the old account).
#    Ensure it has enough XLM to cover transaction fees + reward pool balance.

# 3. Write the new secret to Vault
vault kv put secret/tonalli/admin-stellar secretKey="<NEW_SECRET_KEY>"

# 4. Restart the service so StellarService clears its cached value and fetches the new one.
#    The old account can be left open or merged (stellar account merge) after confirming
#    the new account is operational.

# 5. Audit: confirm the first reward/NFT transaction comes from the new public key.
```

**Impact:** Zero downtime if the new account is funded before the service restarts.

---

## 3. Rotating the Master Encryption Key (Re-encryption Required)

This is the most sensitive rotation because all stored Stellar user secret keys are encrypted with this key.

### Pre-rotation checklist
- [ ] Backup the database before starting
- [ ] Schedule maintenance window (write operations should be paused)
- [ ] Have the old key value available

### Steps

```bash
# 1. Generate a new 32-byte master key
NEW_MASTER_KEY=$(openssl rand -hex 32)

# 2. Write a NEW version to Vault — do NOT overwrite yet
#    Use a staging path first:
vault kv put secret/tonalli/master-key-new masterKey="$NEW_MASTER_KEY"

# 3. Run the re-encryption migration script (see below) with both keys.
#    The script reads every user's stellarSecretKey, decrypts with the OLD key,
#    re-encrypts with the NEW key, and writes back.

# 4. Once migration is verified, promote the new key:
vault kv put secret/tonalli/master-key masterKey="$NEW_MASTER_KEY"

# 5. Restart the service.

# 6. Remove the staging path:
vault kv delete secret/tonalli/master-key-new
```

### Re-encryption migration script (Node.js / ts-node)

```typescript
// scripts/rotate-master-key.ts
// Usage: OLD_KEY=<hex> NEW_KEY=<hex> ts-node scripts/rotate-master-key.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';

const OLD_KEY = Buffer.from(process.env.OLD_KEY!, 'hex');
const NEW_KEY = Buffer.from(process.env.NEW_KEY!, 'hex');
const PREFIX = 'enc:v1:';

function decrypt(ciphertext: string, key: Buffer): string {
  const payload = ciphertext.slice(PREFIX.length);
  const [ivB64, encB64, tagB64] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const enc = Buffer.from(encB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const d = createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return d.update(enc).toString('utf8') + d.final('utf8');
}

function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(plaintext, 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${enc.toString('base64')}:${tag.toString('base64')}`;
}

async function main() {
  const ds = new DataSource({ /* your TypeORM config */ } as any);
  await ds.initialize();

  const users = await ds.query('SELECT id, stellarSecretKey FROM users WHERE stellarSecretKey IS NOT NULL');
  let migrated = 0;

  for (const user of users) {
    const raw: string = user.stellarSecretKey;
    if (!raw.startsWith(PREFIX)) {
      console.warn(`User ${user.id}: plaintext key — skipping (run initial encryption first)`);
      continue;
    }
    const plain = decrypt(raw, OLD_KEY);
    const reEncrypted = encrypt(plain, NEW_KEY);
    await ds.query('UPDATE users SET stellarSecretKey = ? WHERE id = ?', [reEncrypted, user.id]);
    migrated++;
  }

  console.log(`Rotated master key for ${migrated} users.`);
  await ds.destroy();
}

main().catch(console.error);
```

---

## Audit Trail

Every secret access is logged by `VaultService` at the INFO level:

```
[AUDIT] Secret access — path=tonalli/jwt-secret field=value requestedBy=JwtStrategy ts=2026-04-28T...
```

Every secret key export by a user is logged by `UsersService`:

```
[AUDIT] Secret key export requested for user <id> ts=...
[AUDIT] Secret key exported successfully for user <id>
[AUDIT] Failed secret key export attempt for user <id> — wrong password
```

Forward these logs to your SIEM (e.g. Datadog, CloudWatch Logs, or Grafana Loki) to trigger alerts on unexpected access patterns.

---

## Emergency Revocation

If a secret is compromised:

1. **JWT secret** — rotate immediately (step 1 above). All sessions are invalidated.
2. **Admin Stellar key** — freeze the Stellar account via multi-sig or fund a new one (step 2), then rotate.
3. **Master encryption key** — rotate immediately (step 3). Existing encrypted values remain secure because AES-256-GCM is authenticated encryption; the attacker can't decrypt without the key.

For Vault token compromise, revoke the token immediately:

```bash
vault token revoke <compromised-token>
# Then issue a new scoped token for the service
vault token create -policy=tonalli-read -ttl=720h
```
