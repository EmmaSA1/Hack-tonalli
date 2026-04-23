import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';

export interface StellarKeypair {
  publicKey: string;
  secretKey: string;
}

export interface FundResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface NFTMintResult {
  success: boolean;
  txHash?: string;
  assetCode?: string;
  issuerPublicKey?: string;
  error?: string;
}

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: StellarSdk.Horizon.Server;
  private readonly networkPassphrase: string;
  private readonly rewardPoolSecret: string | null;

  constructor(private readonly configService: ConfigService) {
    const horizonUrl =
      this.configService.get('STELLAR_HORIZON_URL') ||
      'https://horizon-testnet.stellar.org';
    this.server = new StellarSdk.Horizon.Server(horizonUrl);
    this.networkPassphrase = StellarSdk.Networks.TESTNET;
    this.rewardPoolSecret =
      this.configService.get('REWARD_POOL_SECRET') || null;
  }

  createKeypair(): StellarKeypair {
    const keypair = StellarSdk.Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  }

  async fundWithFriendbot(publicKey: string): Promise<FundResult> {
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
      );
      const data = await response.json();

      if (response.ok) {
        this.logger.log(`Funded account ${publicKey} via Friendbot`);
        return { success: true, txHash: data.hash || data.id };
      } else {
        this.logger.warn(`Friendbot funding issue: ${JSON.stringify(data)}`);
        return { success: false, error: JSON.stringify(data) };
      }
    } catch (error) {
      this.logger.error(`Friendbot error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getBalance(publicKey: string): Promise<string> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const xlmBalance = account.balances.find(
        (b) => b.asset_type === 'native',
      );
      return xlmBalance ? xlmBalance.balance : '0';
    } catch {
      return '0';
    }
  }

  async sendXLMReward(
    fromSecretKey: string,
    toPublicKey: string,
    amount: string,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
      const sourceAccount = await this.server.loadAccount(
        sourceKeypair.publicKey(),
      );

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: toPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount,
          }),
        )
        .addMemo(StellarSdk.Memo.text('Tonalli XLM Reward'))
        .setTimeout(60)
        .build();

      transaction.sign(sourceKeypair);
      const result = await this.server.submitTransaction(transaction);

      this.logger.log(`XLM reward sent: ${result.hash}`);
      return { success: true, txHash: result.hash };
    } catch (error) {
      this.logger.error(`XLM reward error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async mintNFT(
    userPublicKey: string,
    userSecretKey: string,
    lessonTitle: string,
    lessonId: string,
  ): Promise<NFTMintResult> {
    try {
      const userKeypair = StellarSdk.Keypair.fromSecret(userSecretKey);
      const userAccount = await this.server.loadAccount(userPublicKey);

      const sanitized = lessonTitle
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase()
        .substring(0, 8);
      const assetCode = `TNL${sanitized}`.substring(0, 12);

      const transaction = new StellarSdk.TransactionBuilder(userAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: `TONALLI_CERT`,
            value: Buffer.from(
              JSON.stringify({
                lesson: lessonId,
                title: lessonTitle,
                platform: 'Tonalli',
                issuedAt: new Date().toISOString(),
              }).substring(0, 64),
            ),
          }),
        )
        .addMemo(StellarSdk.Memo.text('Tonalli NFT Certificate'))
        .setTimeout(60)
        .build();

      transaction.sign(userKeypair);
      const result = await this.server.submitTransaction(transaction);

      this.logger.log(`NFT minted for lesson ${lessonId}: ${result.hash}`);
      return {
        success: true,
        txHash: result.hash,
        assetCode: assetCode,
        issuerPublicKey: userPublicKey,
      };
    } catch (error) {
      this.logger.error(`NFT mint error: ${error.message}`);

      return {
        success: false,
        txHash: `SIMULATED_${Date.now()}_${lessonId.substring(0, 8)}`,
        assetCode: `TNLCERT`,
        issuerPublicKey: userPublicKey,
        error: error.message,
      };
    }
  }

  /**
   * Send XLM reward from admin/reward pool wallet to user.
   * This avoids needing the user's secret key.
   */
  async sendRewardFromAdmin(
    toPublicKey: string,
    amount: string,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.rewardPoolSecret) {
      this.logger.warn(
        'REWARD_POOL_SECRET not set — simulating reward transfer',
      );
      return {
        success: true,
        txHash: `SIMULATED_ADMIN_REWARD_${Date.now()}`,
      };
    }

    return this.sendXLMReward(this.rewardPoolSecret, toPublicKey, amount);
  }

  /**
   * Mint NFT certificate signed by admin wallet (no user secret key needed).
   */
  async mintNFTFromAdmin(
    userPublicKey: string,
    lessonTitle: string,
    lessonId: string,
  ): Promise<NFTMintResult> {
    if (!this.rewardPoolSecret) {
      this.logger.warn('REWARD_POOL_SECRET not set — simulating NFT mint');
      return {
        success: true,
        txHash: `SIMULATED_NFT_${Date.now()}_${lessonId.substring(0, 8)}`,
        assetCode: 'TNLCERT',
        issuerPublicKey: userPublicKey,
      };
    }

    try {
      const adminKeypair = StellarSdk.Keypair.fromSecret(this.rewardPoolSecret);
      const adminAccount = await this.server.loadAccount(
        adminKeypair.publicKey(),
      );

      const sanitized = lessonTitle
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase()
        .substring(0, 8);
      const assetCode = `TNL${sanitized}`.substring(0, 12);

      const transaction = new StellarSdk.TransactionBuilder(adminAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: `TONALLI_CERT_${lessonId.substring(0, 20)}`,
            value: Buffer.from(
              JSON.stringify({
                lesson: lessonId,
                title: lessonTitle,
                owner: userPublicKey,
                platform: 'Tonalli',
                issuedAt: new Date().toISOString(),
              }).substring(0, 64),
            ),
          }),
        )
        .addMemo(StellarSdk.Memo.text('Tonalli NFT Certificate'))
        .setTimeout(60)
        .build();

      transaction.sign(adminKeypair);
      const result = await this.server.submitTransaction(transaction);

      this.logger.log(
        `NFT minted (admin) for lesson ${lessonId}: ${result.hash}`,
      );
      return {
        success: true,
        txHash: result.hash,
        assetCode,
        issuerPublicKey: adminKeypair.publicKey(),
      };
    } catch (error) {
      this.logger.error(`Admin NFT mint error: ${error.message}`);
      return {
        success: false,
        txHash: `SIMULATED_NFT_${Date.now()}_${lessonId.substring(0, 8)}`,
        assetCode: 'TNLCERT',
        issuerPublicKey: userPublicKey,
        error: error.message,
      };
    }
  }

  async ensureAccountFunded(publicKey: string): Promise<boolean> {
    const balance = await this.getBalance(publicKey);
    if (parseFloat(balance) < 1) {
      const result = await this.fundWithFriendbot(publicKey);
      return result.success;
    }
    return true;
  }

  /**
   * Build an unsigned XDR transaction for external wallet signing.
   * Used for Freighter and other external signers.
   */
  async buildUnsignedXDR(
    fromPublicKey: string,
    toPublicKey: string,
    amount: string,
    memo?: string,
  ): Promise<{ xdr: string; error?: string }> {
    try {
      const sourceAccount = await this.server.loadAccount(fromPublicKey);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: toPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount,
          }),
        )
        .addMemo(StellarSdk.Memo.text(memo || 'Tonalli XLM Transfer'))
        .setTimeout(60)
        .build();

      // Return unsigned XDR
      const xdr = transaction.toXDR();
      this.logger.log(
        `Built unsigned XDR for ${fromPublicKey} → ${toPublicKey}`,
      );
      return { xdr };
    } catch (error) {
      this.logger.error(`Failed to build unsigned XDR: ${error.message}`);
      return { xdr: '', error: error.message };
    }
  }

  /**
   * Submit a pre-signed XDR transaction to Stellar.
   * Used after external wallet (Freighter) signs the transaction.
   */
  async submitSignedXDR(
    signedXDR: string,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXDR,
        this.networkPassphrase,
      );

      const result = await this.server.submitTransaction(transaction);
      this.logger.log(`Submitted signed XDR: ${result.hash}`);
      return { success: true, txHash: result.hash };
    } catch (error) {
      this.logger.error(`Failed to submit signed XDR: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
