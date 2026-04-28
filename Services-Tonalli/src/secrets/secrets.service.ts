import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

export interface TonalliSecrets {
  STELLAR_ADMIN_SECRET: string;
  REWARD_POOL_SECRET: string;
  JWT_SECRET: string;
  ACTA_API_KEY: string;
}

@Injectable()
export class SecretsService implements OnModuleInit {
  private readonly logger = new Logger(SecretsService.name);
  private secrets: TonalliSecrets | null = null;
  private client: SecretsManagerClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const useVault = this.configService.get<string>('USE_AWS_SECRETS') === 'true';

    // Load from env immediately so secrets are available during module construction
    this.secrets = this.loadFromEnv();

    if (useVault) {
      this.client = new SecretsManagerClient({ region });
    }
  }

  async onModuleInit(): Promise<void> {
    await this.loadSecrets();
  }

  async loadSecrets(): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        '[Secrets] USE_AWS_SECRETS is not enabled — falling back to environment variables. ' +
          'Set USE_AWS_SECRETS=true in production.',
      );
      this.secrets = this.loadFromEnv();
      return;
    }

    const secretName =
      this.configService.get<string>('AWS_SECRET_NAME') || 'tonalli/production';

    try {
      this.logger.log(`[Secrets] Fetching secrets from AWS Secrets Manager: ${secretName}`);
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      const raw = response.SecretString;
      if (!raw) throw new Error('SecretString is empty');

      this.secrets = JSON.parse(raw) as TonalliSecrets;
      this.logger.log('[Secrets] Secrets loaded from AWS Secrets Manager ✓');
    } catch (err) {
      this.logger.error(
        `[Secrets] Failed to load from AWS Secrets Manager: ${err.message}. Falling back to env vars.`,
      );
      this.secrets = this.loadFromEnv();
    }
  }

  get(key: keyof TonalliSecrets): string {
    const value = this.secrets![key];
    this.logger.log(`[Secrets] [AUDIT] Secret accessed: ${key}`);
    return value || '';
  }

  private loadFromEnv(): TonalliSecrets {
    return {
      STELLAR_ADMIN_SECRET: this.configService.get<string>('STELLAR_ADMIN_SECRET') || '',
      REWARD_POOL_SECRET: this.configService.get<string>('REWARD_POOL_SECRET') || '',
      JWT_SECRET: this.configService.get<string>('JWT_SECRET') || 'tonalli_secret_2026',
      ACTA_API_KEY: this.configService.get<string>('ACTA_API_KEY') || '',
    };
  }
}
