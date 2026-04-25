import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import axios from 'axios';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  database: 'connected' | 'disconnected';
  soroban: 'live' | 'unreachable';
  acta: 'reachable' | 'unreachable';
  timestamp: string;
  details?: {
    database?: string;
    soroban?: string;
    acta?: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly stellarServer: StellarSdk.Horizon.Server;
  private readonly actaBaseUrl: string;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {
    const horizonUrl =
      this.configService.get('STELLAR_HORIZON_URL') ||
      'https://horizon-testnet.stellar.org';
    this.stellarServer = new StellarSdk.Horizon.Server(horizonUrl);
    this.actaBaseUrl =
      this.configService.get('ACTA_BASE_URL') ||
      'https://acta.build/api/testnet';
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkSoroban(),
      this.checkActa(),
    ]);

    const [dbResult, sorobanResult, actaResult] = checks;

    const database =
      dbResult.status === 'fulfilled' && dbResult.value.healthy
        ? 'connected'
        : 'disconnected';
    const soroban =
      sorobanResult.status === 'fulfilled' && sorobanResult.value.healthy
        ? 'live'
        : 'unreachable';
    const acta =
      actaResult.status === 'fulfilled' && actaResult.value.healthy
        ? 'reachable'
        : 'unreachable';

    const allHealthy =
      database === 'connected' && soroban === 'live' && acta === 'reachable';
    const someHealthy =
      database === 'connected' || soroban === 'live' || acta === 'reachable';

    const status = allHealthy ? 'ok' : someHealthy ? 'degraded' : 'down';

    const response: HealthStatus = {
      status,
      database,
      soroban,
      acta,
      timestamp,
    };

    // Add error details if any check failed
    const details: any = {};
    if (dbResult.status === 'fulfilled' && !dbResult.value.healthy) {
      details.database = dbResult.value.error;
    }
    if (sorobanResult.status === 'fulfilled' && !sorobanResult.value.healthy) {
      details.soroban = sorobanResult.value.error;
    }
    if (actaResult.status === 'fulfilled' && !actaResult.value.healthy) {
      details.acta = actaResult.value.error;
    }

    if (Object.keys(details).length > 0) {
      response.details = details;
    }

    return response;
  }

  private async checkDatabase(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await this.connection.query('SELECT 1');
      return { healthy: true };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return { healthy: false, error: error.message };
    }
  }

  private async checkSoroban(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Check if Stellar Horizon is reachable
      const ledger = await this.stellarServer.ledgers().limit(1).call();
      if (ledger && ledger.records && ledger.records.length > 0) {
        return { healthy: true };
      }
      return { healthy: false, error: 'No ledger data returned' };
    } catch (error) {
      this.logger.error(`Soroban health check failed: ${error.message}`);
      return { healthy: false, error: error.message };
    }
  }

  private async checkActa(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const response = await axios.get(`${this.actaBaseUrl}/config`, {
        timeout: 5000,
      });
      if (response.status === 200 && response.data) {
        return { healthy: true };
      }
      return { healthy: false, error: `Unexpected status: ${response.status}` };
    } catch (error) {
      this.logger.error(`Acta health check failed: ${error.message}`);
      return { healthy: false, error: error.message };
    }
  }
}
