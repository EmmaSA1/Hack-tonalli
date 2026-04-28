import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { VaultService } from '../vault/vault.service';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const ENCRYPTED_PREFIX = 'enc:v1:';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private masterKey: Buffer | null = null;

  constructor(private readonly vaultService: VaultService) {}

  async onModuleInit() {
    let hexKey = await this.vaultService.getSecret('tonalli/master-key', 'masterKey', 'EncryptionService');

    if (!hexKey || hexKey.length === 0) {
      // Dev mode only: generate ephemeral key and warn loudly
      this.logger.warn(
        'MASTER_ENCRYPTION_KEY not set — generating an ephemeral key. ' +
          'Encrypted values will NOT survive restarts. Set MASTER_ENCRYPTION_KEY in .env for dev, ' +
          'or store secret/data/tonalli/master-key in Vault for production.',
      );
      hexKey = randomBytes(32).toString('hex');
    }

    if (hexKey.length !== 64) {
      throw new Error(
        `Master key must be a 64-character hex string (32 bytes). Got ${hexKey.length} chars. ` +
          'Generate one with: openssl rand -hex 32',
      );
    }

    this.masterKey = Buffer.from(hexKey, 'hex');
    this.logger.log('EncryptionService: master key loaded successfully from Vault');
  }

  /**
   * Encrypt plaintext with AES-256-GCM.
   * Returns a prefixed, colon-delimited string: enc:v1:<iv_b64>:<ciphertext_b64>:<authtag_b64>
   */
  encrypt(plaintext: string): string {
    if (!this.masterKey) throw new Error('EncryptionService is not yet initialized');

    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`;
  }

  /**
   * Decrypt a value produced by encrypt().
   * Returns the original plaintext.
   */
  decrypt(ciphertext: string): string {
    if (!this.masterKey) throw new Error('EncryptionService is not yet initialized');

    if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
      // Legacy plaintext value (pre-encryption migration) — return as-is with a warning
      this.logger.warn(
        '[SECURITY] Decrypting a value that does not have the encrypted prefix. ' +
          'This is a legacy plaintext value — run the key migration script to encrypt it.',
      );
      return ciphertext;
    }

    const payload = ciphertext.slice(ENCRYPTED_PREFIX.length);
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format: expected enc:v1:<iv>:<ciphertext>:<tag>');
    }

    const [ivB64, encB64, tagB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const encrypted = Buffer.from(encB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  }

  /**
   * Returns true if the value was encrypted by this service.
   */
  isEncrypted(value: string): boolean {
    return value.startsWith(ENCRYPTED_PREFIX);
  }
}
