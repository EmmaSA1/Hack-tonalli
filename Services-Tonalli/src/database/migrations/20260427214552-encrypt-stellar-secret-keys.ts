import { MigrationInterface, QueryRunner, DataSource } from 'typeorm';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey || masterKey.length !== 64) {
    throw new Error('ENCRYPTION_MASTER_KEY must be 64 hex characters');
  }
  return Buffer.from(masterKey, 'hex');
}

function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function isEncrypted(value: string): boolean {
  if (!value) return false;
  return value.includes(':') && value.split(':').length === 3;
}

export class EncryptStellarSecretKeys20260427214552 implements MigrationInterface {
  name = 'EncryptStellarSecretKeys20260427214552';
  dataSource: DataSource;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.query('SELECT id, stellarSecretKey FROM users WHERE stellarSecretKey IS NOT NULL');

    for (const user of users) {
      if (user.stellarSecretKey && !isEncrypted(user.stellarSecretKey)) {
        const encrypted = encrypt(user.stellarSecretKey);
        await queryRunner.query(
          'UPDATE users SET stellarSecretKey = ? WHERE id = ?',
          [encrypted, user.id],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY required for rollback');
    }

    const key = Buffer.from(masterKey, 'hex');
    const users = await queryRunner.query('SELECT id, stellarSecretKey FROM users WHERE stellarSecretKey IS NOT NULL');

    for (const user of users) {
      if (user.stellarSecretKey && isEncrypted(user.stellarSecretKey)) {
        const parts = user.stellarSecretKey.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        await queryRunner.query(
          'UPDATE users SET stellarSecretKey = ? WHERE id = ?',
          [decrypted, user.id],
        );
      }
    }
  }
}