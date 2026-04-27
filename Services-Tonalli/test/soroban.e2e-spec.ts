import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SorobanService } from '../src/stellar/soroban.service';
import {
  getNativeBalanceFromHorizon,
  loadDeploymentConfig,
  waitForBalanceChange,
} from './setup/test-fixtures';

describe('SorobanService (testnet e2e)', () => {
  let service: SorobanService;
  const deployment = loadDeploymentConfig();
  const mintedTokenIds: number[] = [];

  beforeAll(async () => {
    process.env.STELLAR_NETWORK = deployment.network;
    process.env.STELLAR_SOROBAN_URL = deployment.rpcUrl;
    process.env.STELLAR_HORIZON_URL = deployment.horizonUrl;
    process.env.STELLAR_ADMIN_SECRET = deployment.adminSecret;
    process.env.NFT_CONTRACT_ID = deployment.nftContractId;
    process.env.REWARDS_CONTRACT_ID = deployment.rewardsContractId;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true })],
      providers: [SorobanService],
    }).compile();

    service = moduleFixture.get<SorobanService>(SorobanService);
  });

  it('mints certificate via SorobanService.mintCertificate and verifies on-chain', async () => {
    const mintResult = await service.mintCertificate({
      userPublicKey: deployment.userPublic,
      lessonId: `lesson-e2e-${Date.now()}`,
      moduleId: 'module-e2e',
      username: 'e2e-user',
      score: 93,
      xpEarned: 120,
      metadataUri: 'ipfs://tonalli/e2e/cert-1',
    });

    expect(mintResult.contractId).toBe(deployment.nftContractId);
    expect(mintResult.txHash).toMatch(/^[a-fA-F0-9]{64}$/);
    expect(mintResult.tokenId).toBeGreaterThan(0);
    mintedTokenIds.push(mintResult.tokenId);

    const certificate = await service.getCertificate(mintResult.tokenId);
    expect(certificate).not.toBeNull();
    expect(certificate?.owner).toBe(deployment.userPublic);
    expect(certificate?.score).toBe(93);
  });

  it('rewards user and verifies native balance changed in Horizon', async () => {
    const before = await getNativeBalanceFromHorizon(
      deployment.userPublic,
      deployment.horizonUrl,
    );

    const reward = await service.rewardUser({
      userPublicKey: deployment.userPublic,
      lessonId: `reward-e2e-${Date.now()}`,
      amountXlm: 0.2,
      score: 80,
    });

    expect(reward.txHash).toMatch(/^[a-fA-F0-9]{64}$/);
    expect(reward.amountXlm).toBeGreaterThan(0);

    const afterBalance = await waitForBalanceChange(
      deployment.userPublic,
      deployment.horizonUrl,
      before.nativeBalance,
      reward.amountXlm - 0.000001,
    );

    expect(afterBalance).toBeGreaterThan(before.nativeBalance);
  });

  it('queries getUserCertificates and matches minted ids', async () => {
    const secondMint = await service.mintCertificate({
      userPublicKey: deployment.userPublic,
      lessonId: `lesson-e2e-query-${Date.now()}`,
      moduleId: 'module-query',
      username: 'e2e-user',
      score: 98,
      xpEarned: 140,
      metadataUri: 'ipfs://tonalli/e2e/cert-2',
    });

    mintedTokenIds.push(secondMint.tokenId);

    const userCertificates = await service.getUserCertificates(
      deployment.userPublic,
    );

    for (const tokenId of mintedTokenIds) {
      expect(userCertificates).toContain(tokenId);
    }

    const certs = await Promise.all(
      mintedTokenIds.map((tokenId) => service.getCertificate(tokenId)),
    );
    expect(certs.every(Boolean)).toBe(true);
    expect(certs.map((cert) => cert?.owner)).toEqual(
      expect.arrayContaining([deployment.userPublic]),
    );
  });
});
