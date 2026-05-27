import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Keypair, Networks, rpc as SorobanRpc } from '@stellar/stellar-sdk';

export interface SorobanTestnetContext {
  adminPublicKey: string;
  adminSecret: string;
  userPublicKey: string;
  userSecret: string;
  nftContractId: string;
  rewardsContractId: string;
  xlmSacAddress: string;
  rpcUrl: string;
  horizonUrl: string;
  network: 'testnet';
  networkPassphrase: string;
  createdAt: string;
}

const TEST_DIR = __dirname;
const PROJECT_ROOT = resolve(TEST_DIR, '..');
const CONTRACTS_ROOT = resolve(PROJECT_ROOT, 'contracts');
const TMP_DIR = resolve(TEST_DIR, '.tmp');
const CONTEXT_PATH = resolve(TMP_DIR, 'soroban-testnet-context.json');

const DEFAULT_RPC_URL = 'https://soroban-testnet.stellar.org';
const DEFAULT_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const DEFAULT_NETWORK = 'testnet' as const;
const DEFAULT_NETWORK_PASSPHRASE = Networks.TESTNET;
const DEFAULT_XLM_SAC =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export function getSorobanTestnetContextPath(): string {
  return process.env.TONALLI_SOROBAN_TESTNET_CONTEXT_PATH || CONTEXT_PATH;
}

export function loadSorobanTestnetContext(): SorobanTestnetContext {
  const contextPath = getSorobanTestnetContextPath();
  return JSON.parse(
    readFileSync(contextPath, 'utf8'),
  ) as SorobanTestnetContext;
}

export function saveSorobanTestnetContext(
  context: SorobanTestnetContext,
): string {
  const contextPath = getSorobanTestnetContextPath();
  mkdirSync(resolve(contextPath, '..'), { recursive: true });
  writeFileSync(contextPath, JSON.stringify(context, null, 2));
  return contextPath;
}

export function cleanupSorobanTestnetArtifacts(): void {
  const contextPath = getSorobanTestnetContextPath();
  rmSync(contextPath, { force: true });
  rmSync(TMP_DIR, { recursive: true, force: true });
}

export function ensureRequiredTooling(): void {
  runCommand('stellar', ['--version'], PROJECT_ROOT, 'Stellar CLI is required.');
  runCommand('cargo', ['--version'], PROJECT_ROOT, 'Rust cargo is required.');
}

export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot funding failed for ${publicKey}: ${body}`);
  }
}

export function buildContracts(): void {
  runCommand(
    'stellar',
    ['contract', 'build'],
    CONTRACTS_ROOT,
    'Failed to build Soroban contracts.',
  );
}

export function deployContract(wasmRelativePath: string, sourceSecret: string): string {
  const output = runCommand(
    'stellar',
    [
      'contract',
      'deploy',
      '--wasm',
      wasmRelativePath,
      '--source',
      sourceSecret,
      '--network',
      DEFAULT_NETWORK,
    ],
    CONTRACTS_ROOT,
    'Failed to deploy contract.',
  );

  return extractContractId(output);
}

export function resolveBuiltWasmPath(contractName: string): string {
  const candidates = [
    `target/wasm32-unknown-unknown/release/${contractName}.wasm`,
    `target/wasm32v1-none/release/${contractName}.wasm`,
  ];

  const match = candidates.find((candidate) =>
    existsSync(resolve(CONTRACTS_ROOT, candidate)),
  );

  if (!match) {
    throw new Error(
      `Could not find built wasm for ${contractName}. Looked in: ${candidates.join(', ')}`,
    );
  }

  return match;
}

export function invokeContract(
  contractId: string,
  sourceSecret: string,
  fnName: string,
  args: string[],
): string {
  return runCommand(
    'stellar',
    [
      'contract',
      'invoke',
      '--id',
      contractId,
      '--source',
      sourceSecret,
      '--network',
      DEFAULT_NETWORK,
      '--',
      fnName,
      ...args,
    ],
    CONTRACTS_ROOT,
    `Failed to invoke ${fnName} on ${contractId}.`,
  );
}

export function getXlmSacAddress(): string {
  try {
    const output = runCommand(
      'stellar',
      ['contract', 'id', 'asset', '--network', DEFAULT_NETWORK, '--asset', 'native'],
      CONTRACTS_ROOT,
      'Failed to resolve XLM SAC address.',
    );

    return extractContractId(output);
  } catch {
    return DEFAULT_XLM_SAC;
  }
}

export async function waitForFunding(
  publicKey: string,
  rpcUrl = DEFAULT_RPC_URL,
): Promise<void> {
  const rpc = new SorobanRpc.Server(rpcUrl, { allowHttp: false });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await rpc.getAccount(publicKey);
      return;
    } catch {
      await sleep(1_000);
    }
  }

  throw new Error(`Timed out waiting for funded account ${publicKey}.`);
}

export async function createFundedKeypair(): Promise<Keypair> {
  const keypair = Keypair.random();
  await fundWithFriendbot(keypair.publicKey());
  await waitForFunding(keypair.publicKey());
  return keypair;
}

export function createFreshContext(overrides?: Partial<SorobanTestnetContext>) {
  return {
    rpcUrl: DEFAULT_RPC_URL,
    horizonUrl: DEFAULT_HORIZON_URL,
    network: DEFAULT_NETWORK,
    networkPassphrase: DEFAULT_NETWORK_PASSPHRASE,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as SorobanTestnetContext;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  errorMessage: string,
): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.error) {
    throw new Error(`${errorMessage} ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    throw new Error(
      `${errorMessage} ${stderr || stdout || `Exit code ${result.status}`}`,
    );
  }

  return `${result.stdout || ''}${result.stderr || ''}`.trim();
}

function extractContractId(output: string): string {
  const match = output.match(/\bC[A-Z0-9]{55}\b/);
  if (!match) {
    throw new Error(`Could not find contract id in output: ${output}`);
  }
  return match[0];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
