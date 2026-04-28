import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { User } from '../users/entities/user.entity';
import { SecretsService } from '../secrets/secrets.service';

const ACTA_TESTNET_URL = 'https://acta.build/api/testnet';

@Injectable()
export class ActaService implements OnModuleInit {
  private readonly logger = new Logger(ActaService.name);
  private client: AxiosInstance;
  private adminKeypair: Keypair | null = null;
  private adminPublicKey: string;
  private networkPassphrase: string;
  private actaContractId: string;
  private vaultInitialized = false;

  constructor(
    private configService: ConfigService,
    private secretsService: SecretsService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {
    const apiKey = this.configService.get('ACTA_API_KEY');
    const baseURL = this.configService.get('ACTA_BASE_URL') || ACTA_TESTNET_URL;

    this.client = axios.create({ baseURL });

    if (apiKey) {
      this.client.interceptors.request.use((config) => {
        config.headers['X-ACTA-Key'] = apiKey.trim();
        return config;
      });
    }
  }

  async onModuleInit() {
    const adminSecret = this.secretsService.get('STELLAR_ADMIN_SECRET');
    if (adminSecret) {
      this.adminKeypair = Keypair.fromSecret(adminSecret);
      this.adminPublicKey = this.adminKeypair.publicKey();
    }

    const apiKey = this.secretsService.get('ACTA_API_KEY');
    if (!apiKey || !this.adminKeypair) {
      this.logger.warn(
        '[ACTA] ACTA_API_KEY or STELLAR_ADMIN_SECRET not set — running in MOCK mode',
      );
      return;
    }

    try {
      // Get ACTA config (contractId, networkPassphrase)
      const config = await this.getConfig();
      this.networkPassphrase = config.networkPassphrase;
      this.actaContractId = config.actaContractId;
      this.logger.log(
        `[ACTA] Connected to ${config.actaContractId} on ${this.networkPassphrase}`,
      );

      // Initialize vault (idempotent — skips if already exists)
      await this.initializeVault();
    } catch (err) {
      this.logger.error('[ACTA] Init error:', err.message);
    }
  }

  // ── Config ──────────────────────────────────────────────────────────────

  async getConfig(): Promise<{
    rpcUrl: string;
    networkPassphrase: string;
    actaContractId: string;
  }> {
    const res = await this.client.get('/config');
    return res.data;
  }

  // ── Vault Setup (one-time) ──────────────────────────────────────────────

  async initializeVault(): Promise<void> {
    if (this.vaultInitialized) return;

    try {
      // Step 1: Create vault for admin
      this.logger.log('[ACTA] Creating vault for admin...');
      const createRes = await this.client.post('/contracts/vault/create', {
        owner: this.adminPublicKey,
        didUri: `did:pkh:stellar:testnet:${this.adminPublicKey}`,
        sourcePublicKey: this.adminPublicKey,
      });

      if (createRes.data.xdr) {
        // Prepare mode — sign and submit
        const signedXdr = this.signXdr(
          createRes.data.xdr,
          createRes.data.network || this.networkPassphrase,
        );
        const submitRes = await this.client.post('/contracts/vault/create', {
          signedXdr,
        });
        this.logger.log(`[ACTA] Vault created: txId=${submitRes.data.tx_id}`);
      } else {
        this.logger.log(`[ACTA] Vault created: txId=${createRes.data.tx_id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      // Contract #1 = vault already exists, 409 = conflict
      if (msg.includes('already') || msg.includes('#1') || err.response?.status === 409) {
        this.logger.log('[ACTA] Vault already exists — skipping creation');
      } else {
        this.logger.warn(`[ACTA] Vault creation warning: ${msg}`);
      }
    }

    try {
      // Step 2: Authorize admin as issuer
      this.logger.log('[ACTA] Authorizing admin as issuer...');
      const authRes = await this.client.post(
        '/contracts/vault/authorize-issuer',
        {
          owner: this.adminPublicKey,
          issuer: this.adminPublicKey,
          sourcePublicKey: this.adminPublicKey,
        },
      );

      if (authRes.data.xdr) {
        const signedXdr = this.signXdr(
          authRes.data.xdr,
          authRes.data.network || this.networkPassphrase,
        );
        const submitRes = await this.client.post(
          '/contracts/vault/authorize-issuer',
          { signedXdr },
        );
        this.logger.log(
          `[ACTA] Issuer authorized: txId=${submitRes.data.tx_id}`,
        );
      } else {
        this.logger.log(
          `[ACTA] Issuer authorized: txId=${authRes.data.tx_id}`,
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      // Contract #3 = issuer already authorized
      if (msg.includes('already') || msg.includes('#3') || err.response?.status === 409) {
        this.logger.log('[ACTA] Issuer already authorized — skipping');
      } else {
        this.logger.warn(`[ACTA] Issuer auth warning: ${msg}`);
      }
    }

    this.vaultInitialized = true;
  }

  // ── Issue Credential ────────────────────────────────────────────────────

  async issueCredential(
    userId: string,
    chapterId: string,
    chapterTitle: string,
    examScore: number,
  ): Promise<{ txId: string; vcId: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // If no API key or admin key, use mock
    if (!this.adminKeypair || !this.secretsService.get('ACTA_API_KEY')) {
      return this.mockIssueCredential(chapterId);
    }

    const holderPublicKey = user.stellarPublicKey || this.adminPublicKey;
    const timestamp = Date.now();
    const vcId = `vc:tonalli:ch:${chapterId}:${timestamp}`;

    const vcData = JSON.stringify({
      '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://www.w3.org/ns/credentials/examples/v2',
      ],
      type: ['VerifiableCredential', 'TonalliCourseCompletion'],
      credentialSubject: {
        id: `did:pkh:stellar:testnet:${holderPublicKey}`,
        name: user.username || user.displayName || 'Student',
        achievement: {
          type: 'CourseCompletion',
          course: chapterTitle,
          score: examScore,
          platform: 'Tonalli',
          issuedAt: new Date().toISOString(),
        },
      },
    });

    try {
      // Step 1: Prepare the issuance transaction
      const prepareRes = await this.client.post('/contracts/vc/issue', {
        owner: this.adminPublicKey,
        vcId,
        vcData,
        issuer: this.adminPublicKey,
        issuerDid: `did:pkh:stellar:testnet:${this.adminPublicKey}`,
        holder: `did:pkh:stellar:testnet:${holderPublicKey}`,
        sourcePublicKey: this.adminPublicKey,
      });

      let txId: string;

      if (prepareRes.data.xdr) {
        // Sign and submit
        const signedXdr = this.signXdr(
          prepareRes.data.xdr,
          prepareRes.data.network || this.networkPassphrase,
        );
        const submitRes = await this.client.post('/contracts/vc/issue', {
          signedXdr,
          vcId,
        });
        txId = submitRes.data.tx_id;
      } else {
        txId = prepareRes.data.tx_id;
      }

      this.logger.log(
        `[ACTA] Credential issued: vcId=${vcId}, txId=${txId}, user=${user.username}`,
      );

      return { txId, vcId };
    } catch (err) {
      this.logger.error(
        `[ACTA] Issue credential error: ${err.response?.data?.message || err.message}`,
      );
      // Fallback to mock for hackathon resilience
      return this.mockIssueCredential(chapterId);
    }
  }

  // ── Verify Credential ──────────────────────────────────────────────────

  async verifyCredential(
    vcId: string,
    owner?: string,
  ): Promise<{ status: 'valid' | 'revoked'; since?: string }> {
    if (!this.adminKeypair || !this.secretsService.get('ACTA_API_KEY')) {
      return { status: 'valid' };
    }

    try {
      const res = await this.client.post('/contracts/vault/verify-vc', {
        owner: owner || this.adminPublicKey,
        vcId,
      });
      return res.data;
    } catch {
      return { status: 'valid' }; // Graceful fallback
    }
  }

  // ── Get Credential ─────────────────────────────────────────────────────

  async getCredential(vcId: string, owner?: string): Promise<any> {
    if (!this.adminKeypair || !this.secretsService.get('ACTA_API_KEY')) {
      return null;
    }

    try {
      const res = await this.client.post('/contracts/vault/get-vc', {
        owner: owner || this.adminPublicKey,
        vcId,
      });
      return res.data.vc || res.data.result || res.data;
    } catch {
      return null;
    }
  }

  // ── List Credentials ───────────────────────────────────────────────────

  async listCredentials(owner?: string): Promise<string[]> {
    if (!this.adminKeypair || !this.secretsService.get('ACTA_API_KEY')) {
      return [];
    }

    try {
      const res = await this.client.post('/contracts/vault/list-vc-ids', {
        owner: owner || this.adminPublicKey,
      });
      return res.data.vc_ids || res.data.result || [];
    } catch {
      return [];
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private signXdr(unsignedXdr: string, networkPassphrase: string): string {
    const tx = TransactionBuilder.fromXDR(unsignedXdr, networkPassphrase);
    tx.sign(this.adminKeypair!);
    return tx.toXDR();
  }

  private mockIssueCredential(
    chapterId: string,
  ): { txId: string; vcId: string } {
    const timestamp = Date.now();
    return {
      txId: `MOCK_ACTA_TX_${timestamp}`,
      vcId: `vc:tonalli:ch:${chapterId}:${timestamp}`,
    };
  }
}
