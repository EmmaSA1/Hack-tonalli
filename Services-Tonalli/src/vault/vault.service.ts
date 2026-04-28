import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private readonly vaultAddr: string;
  private readonly vaultToken: string;
  private readonly devMode: boolean;

  // In-memory cache to avoid hammering Vault on every request
  private readonly cache = new Map<string, string>();

  constructor(private readonly config: ConfigService) {
    this.vaultAddr = this.config.get<string>('VAULT_ADDR') ?? 'http://127.0.0.1:8200';
    this.vaultToken = this.config.get<string>('VAULT_TOKEN') ?? '';
    this.devMode = this.config.get<string>('VAULT_DEV_MODE') === 'true';
  }

  async onModuleInit() {
    if (this.devMode) {
      this.logger.warn(
        'VaultService: running in DEV MODE — secrets read from environment variables. ' +
          'Set VAULT_DEV_MODE=false and configure VAULT_ADDR/VAULT_TOKEN for production.',
      );
      return;
    }

    try {
      const resp = await fetch(`${this.vaultAddr}/v1/sys/health`, {
        headers: { 'X-Vault-Token': this.vaultToken },
      });
      if (!resp.ok) {
        throw new Error(`Vault health check returned HTTP ${resp.status}`);
      }
      this.logger.log(`VaultService: connected to HashiCorp Vault at ${this.vaultAddr}`);
    } catch (err) {
      this.logger.error(
        `VaultService: cannot reach Vault at ${this.vaultAddr} — ${(err as Error).message}. ` +
          'Set VAULT_DEV_MODE=true to use environment variable fallback.',
      );
      throw err;
    }
  }

  /**
   * Fetch a secret from Vault (KV v2) or env fallback in dev mode.
   * All accesses are logged with path, field, caller, and timestamp for audit.
   * The secret value is NEVER logged.
   */
  async getSecret(path: string, field: string, requestedBy = 'system'): Promise<string> {
    const cacheKey = `${path}#${field}`;
    this.logger.log(
      `[AUDIT] Secret access — path=${path} field=${field} requestedBy=${requestedBy} ts=${new Date().toISOString()}`,
    );

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const value = this.devMode
      ? this.devFallback(path, field)
      : await this.fetchFromVault(path, field);

    this.cache.set(cacheKey, value);
    return value;
  }

  /**
   * Invalidate a cached secret (call after key rotation).
   */
  invalidateCache(path: string, field: string) {
    this.cache.delete(`${path}#${field}`);
    this.logger.log(`[AUDIT] Cache invalidated — path=${path} field=${field} ts=${new Date().toISOString()}`);
  }

  private async fetchFromVault(path: string, field: string): Promise<string> {
    const url = `${this.vaultAddr}/v1/secret/data/${path}`;
    const resp = await fetch(url, {
      headers: { 'X-Vault-Token': this.vaultToken },
    });

    if (!resp.ok) {
      throw new Error(`Vault GET ${path} failed with HTTP ${resp.status}`);
    }

    const body = (await resp.json()) as { data?: { data?: Record<string, string> } };
    const value = body?.data?.data?.[field];

    if (!value) {
      throw new Error(`Secret at path "${path}" does not contain field "${field}"`);
    }

    return value;
  }

  private devFallback(path: string, field: string): string {
    const envMap: Record<string, Record<string, string>> = {
      'tonalli/master-key': { masterKey: this.config.get<string>('MASTER_ENCRYPTION_KEY') ?? '' },
      'tonalli/admin-stellar': { secretKey: this.config.get<string>('REWARD_POOL_SECRET') ?? '' },
      'tonalli/jwt-secret': {
        value: this.config.get<string>('JWT_SECRET') ?? 'tonalli_dev_secret_change_in_prod',
      },
    };

    const value = envMap[path]?.[field];
    if (value === undefined) {
      throw new Error(`Dev fallback: no env mapping for path="${path}" field="${field}"`);
    }
    if (!value) {
      this.logger.warn(`[DEV] Env var for ${path}#${field} is empty — set it in .env`);
    }
    return value;
  }
}
