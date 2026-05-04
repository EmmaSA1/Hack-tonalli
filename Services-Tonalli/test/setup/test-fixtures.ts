import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface DeploymentConfig {
  network: 'testnet';
  rpcUrl: string;
  horizonUrl: string;
  adminSecret: string;
  adminPublic: string;
  userSecret: string;
  userPublic: string;
  nftContractId: string;
  rewardsContractId: string;
  xlmSacAddress: string;
  fundedAt: string;
}

export interface AccountBalanceSnapshot {
  nativeBalance: number;
  rawBalances: Array<{ asset_type: string; balance: string }>;
}

export const DEPLOYMENT_CONFIG_PATH = resolve(
  __dirname,
  'deployment-config.json',
);

export const TEST_CLEANUP_PATH = resolve(__dirname, 'test-cleanup.json');

export function loadDeploymentConfig(): DeploymentConfig {
  if (!existsSync(DEPLOYMENT_CONFIG_PATH)) {
    throw new Error(
      `Missing deployment config at ${DEPLOYMENT_CONFIG_PATH}. Run the Soroban global setup first.`,
    );
  }

  return JSON.parse(
    readFileSync(DEPLOYMENT_CONFIG_PATH, 'utf8'),
  ) as DeploymentConfig;
}

export async function getNativeBalanceFromHorizon(
  publicKey: string,
  horizonUrl: string,
): Promise<AccountBalanceSnapshot> {
  const response = await fetch(
    `${horizonUrl}/accounts/${encodeURIComponent(publicKey)}`,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Horizon account lookup failed (${response.status}): ${body}`,
    );
  }

  const account = (await response.json()) as {
    balances: Array<{ asset_type: string; balance: string }>;
  };

  const native = account.balances.find((b) => b.asset_type === 'native');
  if (!native) {
    throw new Error(`No native XLM balance found for ${publicKey}`);
  }

  return {
    nativeBalance: Number(native.balance),
    rawBalances: account.balances,
  };
}

export async function waitForBalanceChange(
  publicKey: string,
  horizonUrl: string,
  previousBalance: number,
  minExpectedDelta: number,
  timeoutMs = 40_000,
): Promise<number> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const snapshot = await getNativeBalanceFromHorizon(publicKey, horizonUrl);
    const delta = snapshot.nativeBalance - previousBalance;
    if (delta >= minExpectedDelta) {
      return snapshot.nativeBalance;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 2_000));
  }

  const latest = await getNativeBalanceFromHorizon(publicKey, horizonUrl);
  throw new Error(
    `Timed out waiting for Horizon balance change. previous=${previousBalance}, latest=${latest.nativeBalance}, expectedDelta=${minExpectedDelta}`,
  );
}
