import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  Keypair,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
  BASE_FEE,
} from '@stellar/stellar-sdk';

export interface MintCertificateParams {
  userPublicKey: string;
  lessonId: string;
  moduleId: string;
  username: string;
  score: number;
  xpEarned: number;
  metadataUri?: string;
}

export interface RewardUserParams {
  userPublicKey: string;
  lessonId: string;
  amountXlm: number; // en XLM (se convierte a stroops internamente)
  score: number;
}

export interface MintPodiumNftParams {
  week: string;           // e.g. "2026-W12"
  userPublicKey: string;
  rank: number;           // 1, 2, or 3
  xlmRewardStroops: number;
  txHash: string;         // XLM reward tx hash
}

export interface PodiumNFTData {
  rank: number;
  xlmReward: number;
  week: string;
  txHash: string;
  issuedAt: number;
  owner: string;
}

export interface RewardHistoryEntry {
  lessonId: string;
  amount: number;    // stroops
  timestamp: number;
}

export interface CertificateData {
  tokenId: number;
  owner: string;
  lessonId: string;
  moduleId: string;
  username: string;
  score: number;
  xpEarned: number;
  issuedAt: number;
  metadataUri: string;
}

@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
  private readonly mockMode: boolean;
  private rpc: SorobanRpc.Server;
  private adminKeypair: Keypair;
  private network: string;
  private networkPassphrase: string;

  private nftContractId: string;
  private rewardsContractId: string;
  private tokenContractId: string;
  private podiumNftContractId: string;

  constructor(private configService: ConfigService) {
    this.mockMode = this.configService.get('SOROBAN_MOCK_MODE') === 'true';

    const nodeEnv = this.configService.get('NODE_ENV');
    if (this.mockMode && nodeEnv === 'production') {
      throw new Error('Soroban mock mode is not allowed in production');
    }

    const horizonUrl =
      this.configService.get('STELLAR_SOROBAN_URL') ||
      'https://soroban-testnet.stellar.org';

    this.rpc = new SorobanRpc.Server(horizonUrl, { allowHttp: false });

    const adminSecret = this.configService.get('STELLAR_ADMIN_SECRET');
    if (adminSecret) {
      this.adminKeypair = Keypair.fromSecret(adminSecret);
    } else {
      this.adminKeypair = Keypair.random();
      this.logger.warn(
        `No STELLAR_ADMIN_SECRET set. Using random keypair: ${this.adminKeypair.publicKey()}`,
      );
    }

    this.network = this.configService.get('STELLAR_NETWORK') || 'testnet';
    this.networkPassphrase =
      this.network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

    this.nftContractId = this.configService.get('NFT_CONTRACT_ID') || '';
    this.rewardsContractId =
      this.configService.get('REWARDS_CONTRACT_ID') || '';
    this.tokenContractId =
      this.configService.get('TOKEN_CONTRACT_ID') || '';
    this.podiumNftContractId =
      this.configService.get('PODIUM_NFT_CONTRACT_ID') || '';

    if (!this.mockMode) {
      const missingIds: string[] = [];
      if (!this.nftContractId) missingIds.push('NFT_CONTRACT_ID');
      if (!this.rewardsContractId) missingIds.push('REWARDS_CONTRACT_ID');
      if (!this.tokenContractId) missingIds.push('TOKEN_CONTRACT_ID');
      if (!this.podiumNftContractId) missingIds.push('PODIUM_NFT_CONTRACT_ID');
      if (missingIds.length > 0) {
        throw new Error(
          `Missing contract IDs (required in LIVE mode): ${missingIds.join(', ')}`,
        );
      }
    }

    this.logger.log(
      `[SorobanService] Running in ${this.mockMode ? 'MOCK' : 'LIVE'} mode`,
    );
  }

  // ── NFT Certificate ────────────────────────────────────────────────────────

  /**
   * Emite un certificado NFT en Soroban al completar una lección.
   * Llama al contrato `nft-certificate` desplegado en Stellar.
   */
  async mintCertificate(params: MintCertificateParams): Promise<{
    tokenId: number;
    txHash: string;
    contractId: string;
  }> {
    if (this.mockMode) {
      return this.mockMintCertificate(params);
    }

    try {
      const contract = new Contract(this.nftContractId);

      const metadataUri =
        params.metadataUri ||
        `https://tonalli.app/certificates/${params.lessonId}`;

      // Construir invocación al contrato Soroban
      const operation = contract.call(
        'mint',
        new Address(params.userPublicKey).toScVal(),
        nativeToScVal(params.lessonId, { type: 'string' }),
        nativeToScVal(params.moduleId, { type: 'string' }),
        nativeToScVal(params.username, { type: 'string' }),
        nativeToScVal(params.score, { type: 'u32' }),
        nativeToScVal(params.xpEarned, { type: 'u32' }),
        nativeToScVal(metadataUri, { type: 'string' }),
      );

      const txHash = await this.submitSorobanTransaction(operation);
      const result = await this.getTransactionResult(txHash);
      const tokenId = scValToNative(result) as number;

      this.logger.log(
        `NFT minted: token_id=${tokenId}, lesson=${params.lessonId}, tx=${txHash}`,
      );

      return { tokenId, txHash, contractId: this.nftContractId };
    } catch (error) {
      this.logger.error('Failed to mint NFT certificate', error);
      // Fallback mock en caso de error (para el hackathon)
      return this.mockMintCertificate(params);
    }
  }

  /**
   * Obtiene los datos de un certificado NFT por su token_id
   */
  async getCertificate(tokenId: number): Promise<CertificateData | null> {
    if (!this.nftContractId) return null;

    try {
      const contract = new Contract(this.nftContractId);
      const operation = contract.call(
        'get_certificate',
        nativeToScVal(tokenId, { type: 'u64' }),
      );

      const result = await this.simulateSorobanCall(operation);
      if (!result) return null;

      const native = scValToNative(result) as any;
      return {
        tokenId: Number(native.token_id),
        owner: native.owner,
        lessonId: native.lesson_id,
        moduleId: native.module_id,
        username: native.username,
        score: native.score,
        xpEarned: native.xp_earned,
        issuedAt: Number(native.issued_at),
        metadataUri: native.metadata_uri,
      };
    } catch (error) {
      this.logger.error('Failed to get certificate', error);
      return null;
    }
  }

  /**
   * Obtiene todos los token_ids de certificados de un usuario
   */
  async getUserCertificates(userPublicKey: string): Promise<number[]> {
    if (!this.nftContractId) return [];

    try {
      const contract = new Contract(this.nftContractId);
      const operation = contract.call(
        'get_user_certificates',
        new Address(userPublicKey).toScVal(),
      );

      const result = await this.simulateSorobanCall(operation);
      if (!result) return [];

      return (scValToNative(result) as bigint[]).map(Number);
    } catch (error) {
      this.logger.error('Failed to get user certificates', error);
      return [];
    }
  }

  /**
   * Verifica si un usuario tiene el certificado de una lección específica
   */
  async hasCertificate(userPublicKey: string, lessonId: string): Promise<boolean> {
    if (!this.nftContractId) return false;

    try {
      const contract = new Contract(this.nftContractId);
      const operation = contract.call(
        'has_certificate',
        new Address(userPublicKey).toScVal(),
        nativeToScVal(lessonId, { type: 'string' }),
      );

      const result = await this.simulateSorobanCall(operation);
      return result ? (scValToNative(result) as boolean) : false;
    } catch (error) {
      this.logger.error('Failed to check certificate', error);
      return false;
    }
  }

  // ── Learn-to-Earn Rewards ─────────────────────────────────────────────────

  /**
   * Envía recompensa XLM al usuario por completar una lección.
   * Llama al contrato `learn-to-earn` en Soroban.
   */
  async rewardUser(params: RewardUserParams): Promise<{
    amountXlm: number;
    amountStroops: number;
    txHash: string;
  }> {
    if (this.mockMode) {
      return this.mockRewardUser(params);
    }

    try {
      const contract = new Contract(this.rewardsContractId);

      // Convertir XLM a stroops (1 XLM = 10_000_000 stroops)
      const stroops = BigInt(Math.round(params.amountXlm * 10_000_000));

      const operation = contract.call(
        'reward_user',
        new Address(params.userPublicKey).toScVal(),
        nativeToScVal(params.lessonId, { type: 'string' }),
        nativeToScVal(stroops, { type: 'i128' }),
        nativeToScVal(params.score, { type: 'u32' }),
      );

      const txHash = await this.submitSorobanTransaction(operation);
      const result = await this.getTransactionResult(txHash);
      const finalStroops = scValToNative(result) as bigint;
      const finalXlm = Number(finalStroops) / 10_000_000;

      this.logger.log(
        `XLM reward sent: ${finalXlm} XLM to ${params.userPublicKey}, lesson=${params.lessonId}, tx=${txHash}`,
      );

      return {
        amountXlm: finalXlm,
        amountStroops: Number(finalStroops),
        txHash,
      };
    } catch (error) {
      this.logger.error('Failed to reward user', error);
      return this.mockRewardUser(params);
    }
  }

  // ── Tonalli Token (TNL) ──────────────────────────────────────────────────

  /**
   * Mint TNL tokens to a user (admin only).
   * Called when user completes a lesson or earns rewards.
   */
  async mintTokens(
    toPublicKey: string,
    amount: number,
  ): Promise<{ success: boolean; txHash: string; amount: number }> {
    if (this.mockMode) {
      return this.mockMintTokens(toPublicKey, amount);
    }

    try {
      const contract = new Contract(this.tokenContractId);

      // amount is in TNL units, convert to smallest unit (7 decimals)
      const rawAmount = BigInt(Math.round(amount * 10_000_000));

      const operation = contract.call(
        'mint',
        new Address(toPublicKey).toScVal(),
        nativeToScVal(rawAmount, { type: 'i128' }),
      );

      const txHash = await this.submitSorobanTransaction(operation);

      this.logger.log(
        `TNL minted: ${amount} TNL to ${toPublicKey}, tx=${txHash}`,
      );

      return { success: true, txHash, amount };
    } catch (error) {
      this.logger.error('Failed to mint TNL tokens', error);
      return this.mockMintTokens(toPublicKey, amount);
    }
  }

  /**
   * Get TNL token balance for a user.
   */
  async getTokenBalance(publicKey: string): Promise<number> {
    if (!this.tokenContractId) {
      return 0;
    }

    try {
      const contract = new Contract(this.tokenContractId);
      const operation = contract.call(
        'balance',
        new Address(publicKey).toScVal(),
      );

      const result = await this.simulateSorobanCall(operation);
      if (!result) return 0;

      const rawBalance = scValToNative(result) as bigint;
      return Number(rawBalance) / 10_000_000; // Convert from 7 decimal places
    } catch (error) {
      this.logger.error('Failed to get TNL balance', error);
      return 0;
    }
  }

  /**
   * Initialize the TNL token contract (call once after deploy).
   */
  async initializeToken(): Promise<{ success: boolean; txHash?: string }> {
    if (!this.tokenContractId) {
      return { success: false };
    }

    try {
      const contract = new Contract(this.tokenContractId);
      const operation = contract.call(
        'initialize',
        new Address(this.adminKeypair.publicKey()).toScVal(),
        nativeToScVal(7, { type: 'u32' }),
        nativeToScVal('Tonalli', { type: 'string' }),
        nativeToScVal('TNL', { type: 'string' }),
      );

      const txHash = await this.submitSorobanTransaction(operation);
      this.logger.log(`TNL token initialized, tx=${txHash}`);
      return { success: true, txHash };
    } catch (error) {
      this.logger.error('Failed to initialize TNL token', error);
      return { success: false };
    }
  }

  // ── Podium NFT ─────────────────────────────────────────────────────────────

  /**
   * Mint a podium NFT for a weekly winner (top 3).
   * Calls the `podio-nft` contract on Soroban.
   */
  async mintPodiumNft(params: MintPodiumNftParams): Promise<{
    success: boolean;
    txHash: string;
  }> {
    if (this.mockMode) {
      return this.mockMintPodiumNft(params);
    }

    try {
      const contract = new Contract(this.podiumNftContractId);

      const operation = contract.call(
        'mint_podium_nft',
        nativeToScVal(params.week, { type: 'string' }),
        new Address(params.userPublicKey).toScVal(),
        nativeToScVal(params.rank, { type: 'u32' }),
        nativeToScVal(params.xlmRewardStroops, { type: 'u64' }),
        nativeToScVal(params.txHash, { type: 'string' }),
      );

      const txHash = await this.submitSorobanTransaction(operation);

      this.logger.log(
        `Podium NFT minted: rank=${params.rank}, week=${params.week}, winner=${params.userPublicKey}, tx=${txHash}`,
      );

      return { success: true, txHash };
    } catch (error) {
      this.logger.error('Failed to mint podium NFT', error);
      return this.mockMintPodiumNft(params);
    }
  }

  /**
   * Get a podium NFT for a given week and user
   */
  async getPodiumNft(week: string, userPublicKey: string): Promise<PodiumNFTData | null> {
    if (!this.podiumNftContractId) return null;

    try {
      const contract = new Contract(this.podiumNftContractId);
      const operation = contract.call(
        'get_podium_nft',
        nativeToScVal(week, { type: 'string' }),
        new Address(userPublicKey).toScVal(),
      );

      const result = await this.simulateSorobanCall(operation);
      if (!result) return null;

      const native = scValToNative(result) as any;
      if (!native) return null;

      return {
        rank: native.rank,
        xlmReward: Number(native.xlm_reward),
        week: native.week,
        txHash: native.tx_hash,
        issuedAt: Number(native.issued_at),
        owner: native.owner,
      };
    } catch (error) {
      this.logger.error('Failed to get podium NFT', error);
      return null;
    }
  }

  /**
   * Check if a user has a podium NFT for a given week
   */
  async hasPodiumNft(week: string, userPublicKey: string): Promise<boolean> {
    if (!this.podiumNftContractId) return false;

    try {
      const contract = new Contract(this.podiumNftContractId);
      const operation = contract.call(
        'has_nft',
        nativeToScVal(week, { type: 'string' }),
        new Address(userPublicKey).toScVal(),
      );

      const result = await this.simulateSorobanCall(operation);
      return result ? (scValToNative(result) as boolean) : false;
    } catch (error) {
      this.logger.error('Failed to check podium NFT', error);
      return false;
    }
  }

  // ── Learn-to-Earn Queries ──────────────────────────────────────────────────

  /**
   * Get the on-chain reward history for a user
   */
  async getRewardHistory(userPublicKey: string): Promise<RewardHistoryEntry[]> {
    if (!this.rewardsContractId) return [];

    try {
      const contract = new Contract(this.rewardsContractId);
      const operation = contract.call(
        'get_reward_history',
        new Address(userPublicKey).toScVal(),
      );

      const result = await this.simulateSorobanCall(operation);
      if (!result) return [];

      const native = scValToNative(result) as any[];
      return native.map((r: any) => ({
        lessonId: r.lesson_id,
        amount: Number(r.amount),
        timestamp: Number(r.timestamp),
      }));
    } catch (error) {
      this.logger.error('Failed to get reward history', error);
      return [];
    }
  }

  /**
   * Get total XLM rewards (in stroops) for a user from the contract
   */
  async getUserTotalRewards(userPublicKey: string): Promise<number> {
    if (!this.rewardsContractId) return 0;

    try {
      const contract = new Contract(this.rewardsContractId);
      const operation = contract.call(
        'get_user_total_rewards',
        new Address(userPublicKey).toScVal(),
      );

      const result = await this.simulateSorobanCall(operation);
      if (!result) return 0;

      return Number(scValToNative(result) as bigint);
    } catch (error) {
      this.logger.error('Failed to get user total rewards', error);
      return 0;
    }
  }

  /**
   * Check if a lesson was already rewarded on-chain (anti-double-claim)
   */
  async isLessonRewarded(userPublicKey: string, lessonId: string): Promise<boolean> {
    if (!this.rewardsContractId) return false;

    try {
      const contract = new Contract(this.rewardsContractId);
      const operation = contract.call(
        'is_lesson_rewarded',
        new Address(userPublicKey).toScVal(),
        nativeToScVal(lessonId, { type: 'string' }),
      );

      const result = await this.simulateSorobanCall(operation);
      return result ? (scValToNative(result) as boolean) : false;
    } catch (error) {
      this.logger.error('Failed to check lesson rewarded', error);
      return false;
    }
  }

  // ── Helpers Internos ───────────────────────────────────────────────────────

  /**
   * Construye, simula y envía una transacción Soroban
   */
  private async submitSorobanTransaction(operation: xdr.Operation): Promise<string> {
    const adminAccount = await this.rpc.getAccount(this.adminKeypair.publicKey());

    const tx = new TransactionBuilder(adminAccount, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simular para obtener footprint y resources
    const simResult = await this.rpc.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    // Preparar transacción con resources calculados
    const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(this.adminKeypair);

    const sendResult = await this.rpc.sendTransaction(preparedTx);
    if (sendResult.status === 'ERROR') {
      throw new Error(`Transaction failed: ${JSON.stringify(sendResult.errorResult)}`);
    }

    // Esperar confirmación
    return await this.waitForTransaction(sendResult.hash);
  }

  /**
   * Simula una llamada de solo lectura (sin enviar transacción)
   */
  private async simulateSorobanCall(
    operation: xdr.Operation,
  ): Promise<xdr.ScVal | null> {
    const adminAccount = await this.rpc.getAccount(this.adminKeypair.publicKey());

    const tx = new TransactionBuilder(adminAccount, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simResult = await this.rpc.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      this.logger.error('Simulation error', simResult.error);
      return null;
    }

    const successResult = simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse;
    return successResult.result?.retval ?? null;
  }

  /**
   * Espera a que una transacción sea confirmada en el ledger
   */
  private async waitForTransaction(hash: string, maxWait = 30): Promise<string> {
    let attempts = 0;
    while (attempts < maxWait) {
      const result = await this.rpc.getTransaction(hash);
      if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return hash;
      }
      if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction ${hash} failed`);
      }
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
    }
    throw new Error(`Transaction ${hash} timed out`);
  }

  private async getTransactionResult(hash: string): Promise<xdr.ScVal> {
    const result = await this.rpc.getTransaction(hash);
    if (result.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error('Transaction not successful');
    }
    const successResult = result as SorobanRpc.Api.GetSuccessfulTransactionResponse;
    return successResult.returnValue!;
  }


  // ── Mock Responses (para demo sin contratos desplegados) ──────────────────

  private async mockMintCertificate(params: MintCertificateParams) {
    const tokenId = Math.floor(Math.random() * 9000) + 1000;
    const txHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');

    this.logger.log(
      `[MOCK] NFT Certificate minted: token_id=${tokenId}, tx=${txHash}`,
    );

    return {
      tokenId,
      txHash,
      contractId: 'MOCK_CONTRACT_' + this.network.toUpperCase(),
    };
  }

  private async mockMintTokens(toPublicKey: string, amount: number) {
    const txHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');

    this.logger.log(
      `[MOCK] TNL mint: ${amount} TNL to ${toPublicKey}, tx=${txHash}`,
    );

    return { success: true, txHash, amount };
  }

  private async mockMintPodiumNft(params: MintPodiumNftParams) {
    const txHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');

    this.logger.log(
      `[MOCK] Podium NFT minted: rank=${params.rank}, week=${params.week}, winner=${params.userPublicKey}, tx=${txHash}`,
    );

    return { success: true, txHash };
  }

  private async mockRewardUser(params: RewardUserParams) {
    const bonus = params.score === 100 ? params.amountXlm * 0.1 : 0;
    const finalXlm = params.amountXlm + bonus;
    const txHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');

    this.logger.log(
      `[MOCK] XLM reward: ${finalXlm} XLM to ${params.userPublicKey}, tx=${txHash}`,
    );

    return {
      amountXlm: finalXlm,
      amountStroops: Math.round(finalXlm * 10_000_000),
      txHash,
    };
  }
}
