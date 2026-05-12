import { ConfigService } from '@nestjs/config';
import { Horizon, rpc as SorobanRpc } from '@stellar/stellar-sdk';
import { SorobanService } from '../src/stellar/soroban.service';
import {
  cleanupSorobanTestnetArtifacts,
  SorobanTestnetContext,
  loadSorobanTestnetContext,
} from './soroban-testnet-harness';

describe('SorobanService testnet integration', () => {
  let context: SorobanTestnetContext;
  let sorobanService: SorobanService;
  let horizon: Horizon.Server;
  let rpc: SorobanRpc.Server;

  beforeAll(() => {
    context = loadSorobanTestnetContext();

    sorobanService = new SorobanService(
      new ConfigService({
        STELLAR_NETWORK: context.network,
        STELLAR_SOROBAN_URL: context.rpcUrl,
        STELLAR_ADMIN_SECRET: context.adminSecret,
        NFT_CONTRACT_ID: context.nftContractId,
        REWARDS_CONTRACT_ID: context.rewardsContractId,
      }),
    );

    horizon = new Horizon.Server(context.horizonUrl);
    rpc = new SorobanRpc.Server(context.rpcUrl, { allowHttp: false });
  });

  beforeEach(() => {
    jest.setTimeout(180_000);
  });

  afterAll(() => {
    cleanupSorobanTestnetArtifacts();
  });

  it('mints a certificate and verifies the on-chain payload', async () => {
    const suffix = Date.now().toString();

    const minted = await sorobanService.mintCertificate({
      userPublicKey: context.userPublicKey,
      lessonId: `lesson-${suffix}`,
      moduleId: `module-${suffix}`,
      username: `test-user-${suffix}`,
      score: 93,
      xpEarned: 55,
      metadataUri: `https://tonalli.test/certificates/${suffix}`,
    });

    expect(minted.contractId).toBe(context.nftContractId);
    expect(minted.tokenId).toBeGreaterThan(0);

    await waitForSuccessfulTransaction(rpc, minted.txHash);

    const certificate = await sorobanService.getCertificate(minted.tokenId);
    expect(certificate).not.toBeNull();
    expect(certificate).toMatchObject({
      tokenId: minted.tokenId,
      owner: context.userPublicKey,
      lessonId: `lesson-${suffix}`,
      moduleId: `module-${suffix}`,
      username: `test-user-${suffix}`,
      score: 93,
      xpEarned: 55,
      metadataUri: `https://tonalli.test/certificates/${suffix}`,
    });
  });

  it('rewards a user and verifies the Horizon balance increase', async () => {
    const beforeBalance = await getNativeBalance(context.userPublicKey, horizon);
    const suffix = Date.now().toString();

    const reward = await sorobanService.rewardUser({
      userPublicKey: context.userPublicKey,
      lessonId: `reward-${suffix}`,
      amountXlm: 0.5,
      score: 100,
    });

    expect(reward.amountXlm).toBeCloseTo(0.55, 7);
    expect(reward.amountStroops).toBe(5_500_000);

    await waitForSuccessfulTransaction(rpc, reward.txHash);

    const afterBalance = await waitForBalanceIncrease(
      context.userPublicKey,
      horizon,
      beforeBalance,
    );
    expect(afterBalance - beforeBalance).toBeCloseTo(0.55, 6);

    const totalRewards = await sorobanService.getUserTotalRewards(
      context.userPublicKey,
    );
    expect(totalRewards).toBeGreaterThanOrEqual(5_500_000);
  });

  it('returns user certificates that match minted on-chain records', async () => {
    const seed = Date.now();
    const mintedLessons = [
      {
        lessonId: `query-${seed}-a`,
        moduleId: `query-module-${seed}`,
        username: `query-user-${seed}`,
        score: 88,
        xpEarned: 40,
      },
      {
        lessonId: `query-${seed}-b`,
        moduleId: `query-module-${seed}`,
        username: `query-user-${seed}`,
        score: 99,
        xpEarned: 60,
      },
    ];

    const mintedResults = [];
    for (const lesson of mintedLessons) {
      mintedResults.push(
        await sorobanService.mintCertificate({
          userPublicKey: context.userPublicKey,
          metadataUri: `https://tonalli.test/certificates/${lesson.lessonId}`,
          ...lesson,
        }),
      );
    }

    const tokenIds = await sorobanService.getUserCertificates(
      context.userPublicKey,
    );

    for (const minted of mintedResults) {
      expect(tokenIds).toContain(minted.tokenId);
    }

    const certificates = await Promise.all(
      mintedResults.map((minted) => sorobanService.getCertificate(minted.tokenId)),
    );

    expect(certificates).toHaveLength(2);
    expect(certificates[0]).toMatchObject({
      tokenId: mintedResults[0].tokenId,
      owner: context.userPublicKey,
      lessonId: mintedLessons[0].lessonId,
      moduleId: mintedLessons[0].moduleId,
      username: mintedLessons[0].username,
      score: mintedLessons[0].score,
      xpEarned: mintedLessons[0].xpEarned,
    });
    expect(certificates[1]).toMatchObject({
      tokenId: mintedResults[1].tokenId,
      owner: context.userPublicKey,
      lessonId: mintedLessons[1].lessonId,
      moduleId: mintedLessons[1].moduleId,
      username: mintedLessons[1].username,
      score: mintedLessons[1].score,
      xpEarned: mintedLessons[1].xpEarned,
    });
  });
});

async function getNativeBalance(
  publicKey: string,
  horizon: Horizon.Server,
): Promise<number> {
  const account = await horizon.loadAccount(publicKey);
  const balance = account.balances.find((entry) => entry.asset_type === 'native');
  return Number(balance?.balance || '0');
}

async function waitForBalanceIncrease(
  publicKey: string,
  horizon: Horizon.Server,
  beforeBalance: number,
): Promise<number> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const nextBalance = await getNativeBalance(publicKey, horizon);
    if (nextBalance > beforeBalance) {
      return nextBalance;
    }
    await sleep(1_000);
  }

  throw new Error(`Timed out waiting for Horizon balance increase for ${publicKey}.`);
}

async function waitForSuccessfulTransaction(
  rpc: SorobanRpc.Server,
  hash: string,
): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const tx = await rpc.getTransaction(hash);
    if (tx.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return;
    }
    if (tx.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction ${hash} failed on testnet.`);
    }
    await sleep(1_000);
  }

  throw new Error(`Timed out waiting for transaction ${hash}.`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
