import {
  buildContracts,
  createFreshContext,
  createFundedKeypair,
  deployContract,
  ensureRequiredTooling,
  getXlmSacAddress,
  invokeContract,
  resolveBuiltWasmPath,
  saveSorobanTestnetContext,
} from './soroban-testnet-harness';

async function main() {
  ensureRequiredTooling();

  const admin = await createFundedKeypair();
  const user = await createFundedKeypair();

  buildContracts();

  const nftContractId = deployContract(
    resolveBuiltWasmPath('nft_certificate'),
    admin.secret(),
  );
  invokeContract(nftContractId, admin.secret(), 'initialize', [
    '--admin',
    admin.publicKey(),
  ]);

  const rewardsContractId = deployContract(
    resolveBuiltWasmPath('learn_to_earn'),
    admin.secret(),
  );

  const xlmSacAddress = getXlmSacAddress();
  invokeContract(rewardsContractId, admin.secret(), 'initialize', [
    '--admin',
    admin.publicKey(),
    '--xlm_token',
    xlmSacAddress,
  ]);
  invokeContract(rewardsContractId, admin.secret(), 'deposit', [
    '--from',
    admin.publicKey(),
    '--amount',
    '1000000000',
  ]);

  const context = createFreshContext({
    adminPublicKey: admin.publicKey(),
    adminSecret: admin.secret(),
    userPublicKey: user.publicKey(),
    userSecret: user.secret(),
    nftContractId,
    rewardsContractId,
    xlmSacAddress,
  });

  const contextPath = saveSorobanTestnetContext(context);
  process.stdout.write(`Soroban testnet context saved to ${contextPath}\n`);
}

void main().catch((error: Error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
