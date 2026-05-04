import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import {
  DEPLOYMENT_CONFIG_PATH,
  TEST_CLEANUP_PATH,
  getNativeBalanceFromHorizon,
} from './test-fixtures';

const NETWORK = 'testnet';
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';
const RPC_URL =
  process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
const RPC_ARGS = `--rpc-url ${RPC_URL} --network-passphrase "${NETWORK_PASSPHRASE}"`;
const ENV_CONTRACTS_PATH = resolve(__dirname, '..', '..', '.env.contracts');
const ENV_PATH = resolve(__dirname, '..', '..', '.env');

interface ExistingConfig {
  adminSecret: string;
  nftContractId: string;
  rewardsContractId: string;
}

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const out: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

function loadExistingConfigForTlsFallback(): ExistingConfig {
  const envContracts = parseEnvFile(ENV_CONTRACTS_PATH);
  const envFile = parseEnvFile(ENV_PATH);
  const adminSecret =
    process.env.STELLAR_ADMIN_SECRET ??
    envFile.STELLAR_ADMIN_SECRET ??
    envContracts.STELLAR_ADMIN_SECRET ??
    '';
  const nftContractId =
    process.env.NFT_CONTRACT_ID ??
    envFile.NFT_CONTRACT_ID ??
    envContracts.NFT_CONTRACT_ID ??
    '';
  const rewardsContractId =
    process.env.REWARDS_CONTRACT_ID ??
    envFile.REWARDS_CONTRACT_ID ??
    envContracts.REWARDS_CONTRACT_ID ??
    '';

  if (!adminSecret || !nftContractId || !rewardsContractId) {
    throw new Error(
      [
        'Stellar CLI TLS validation failed (UnknownIssuer), and fallback config is incomplete.',
        'Set these env vars (or add them to .env.contracts):',
        '- STELLAR_ADMIN_SECRET',
        '- NFT_CONTRACT_ID',
        '- REWARDS_CONTRACT_ID',
      ].join('\n'),
    );
  }

  return { adminSecret, nftContractId, rewardsContractId };
}

function run(command: string, cwd: string): string {
  try {
    return execSync(command, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      env: process.env,
    }).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('UnknownIssuer')) {
      throw new Error(
        [
          'Stellar CLI TLS validation failed (UnknownIssuer).',
          'Your machine does not trust the certificate chain for the Soroban RPC endpoint.',
          'Fix options:',
          '1) Install/update your corporate root CA in the Windows trusted root store.',
          '2) Or provide a trusted testnet RPC endpoint via STELLAR_RPC_URL.',
          '3) If your environment uses a custom CA bundle, set SSL_CERT_FILE to that PEM path before running tests.',
        ].join('\n'),
      );
    }
    throw error;
  }
}

async function fundWithFriendbot(publicKey: string): Promise<void> {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Friendbot failed for ${publicKey} (${response.status}): ${body}`,
    );
  }
}

function parseContractId(stdout: string): string {
  const match = stdout.match(/C[A-Z2-7]{55,}/);
  if (!match?.[0]) {
    throw new Error(`Could not parse contract id from output: ${stdout}`);
  }
  return match[0];
}

export default async function globalSetup(): Promise<void> {
  const testRoot = resolve(__dirname, '..');
  const contractsDir = resolve(testRoot, '..', 'contracts');
  const setupDir = dirname(DEPLOYMENT_CONFIG_PATH);
  mkdirSync(setupDir, { recursive: true });

  const user = Keypair.random();
  let adminSecret = '';
  let adminPublic = '';
  let nftContractId = '';
  let rewardsContractId = '';
  let xlmSacAddress = '';

  try {
    run('stellar --version', contractsDir);
    const admin = Keypair.random();
    adminSecret = admin.secret();
    adminPublic = admin.publicKey();

    await fundWithFriendbot(admin.publicKey());

    run('stellar contract build', contractsDir);

    const xlmSacStdout = run(
      `stellar contract id asset --asset native --source-account ${admin.secret()} ${RPC_ARGS}`,
      contractsDir,
    );
    xlmSacAddress = parseContractId(xlmSacStdout);

    const nftDeployStdout = run(
      [
        'stellar contract deploy',
        '--wasm target/wasm32-unknown-unknown/release/nft_certificate.wasm',
        `--source-account ${admin.secret()}`,
        RPC_ARGS,
      ].join(' '),
      contractsDir,
    );
    nftContractId = parseContractId(nftDeployStdout);

    run(
      [
        'stellar contract invoke',
        `--id ${nftContractId}`,
        `--source-account ${admin.secret()}`,
        RPC_ARGS,
        '--',
        'initialize',
        `--admin ${admin.publicKey()}`,
      ].join(' '),
      contractsDir,
    );

    const rewardsDeployStdout = run(
      [
        'stellar contract deploy',
        '--wasm target/wasm32-unknown-unknown/release/learn_to_earn.wasm',
        `--source-account ${admin.secret()}`,
        RPC_ARGS,
      ].join(' '),
      contractsDir,
    );
    rewardsContractId = parseContractId(rewardsDeployStdout);

    run(
      [
        'stellar contract invoke',
        `--id ${rewardsContractId}`,
        `--source-account ${admin.secret()}`,
        RPC_ARGS,
        '--',
        'initialize',
        `--admin ${admin.publicKey()}`,
        `--xlm_token ${xlmSacAddress}`,
      ].join(' '),
      contractsDir,
    );

    run(
      [
        'stellar contract invoke',
        `--id ${rewardsContractId}`,
        `--source-account ${admin.secret()}`,
        RPC_ARGS,
        '--',
        'deposit',
        `--from ${admin.publicKey()}`,
        '--amount 500000000',
      ].join(' '),
      contractsDir,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('UnknownIssuer')) {
      throw error;
    }

    const existing = loadExistingConfigForTlsFallback();
    adminSecret = existing.adminSecret;
    adminPublic = Keypair.fromSecret(existing.adminSecret).publicKey();
    nftContractId = existing.nftContractId;
    rewardsContractId = existing.rewardsContractId;
  }

  await fundWithFriendbot(user.publicKey());

  const deploymentConfig = {
    network: NETWORK,
    rpcUrl: RPC_URL,
    horizonUrl: HORIZON_URL,
    adminSecret,
    adminPublic,
    userSecret: user.secret(),
    userPublic: user.publicKey(),
    nftContractId,
    rewardsContractId,
    xlmSacAddress,
    fundedAt: new Date().toISOString(),
  };

  writeFileSync(
    DEPLOYMENT_CONFIG_PATH,
    `${JSON.stringify(deploymentConfig, null, 2)}\n`,
    'utf8',
  );

  writeFileSync(
    TEST_CLEANUP_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        removeFiles: [DEPLOYMENT_CONFIG_PATH, TEST_CLEANUP_PATH],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  await getNativeBalanceFromHorizon(user.publicKey(), HORIZON_URL);
}
