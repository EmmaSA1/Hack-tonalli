#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Tonalli — Deploy Soroban Contracts
# Supports: testnet | mainnet
# ─────────────────────────────────────────────────────────────────────────────
# Requisitos:
#   - Rust + cargo: https://rustup.rs
#   - stellar CLI v21+: cargo install --locked stellar-cli@21 --features opt
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh                        # testnet (default)
#   DEPLOY_ENV=mainnet ./deploy.sh     # mainnet
#
# Pre-deploy checklist (mainnet):
#   [ ] External audit approved and all fixes applied
#   [ ] 100% tests passing (cargo test --workspace)
#   [ ] Admin keypair loaded from HSM/KMS — NOT from .env
#   [ ] Initial reward pool XLM calculated and available
#   [ ] Rollback plan documented
#   [ ] ADMIN_SECRET set via secure environment (not .env file)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Environment selection ─────────────────────────────────────────────────────
DEPLOY_ENV="${DEPLOY_ENV:-testnet}"

if [ "$DEPLOY_ENV" = "mainnet" ]; then
  NETWORK="mainnet"
  NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
  RPC_URL="https://mainnet.stellar.validationcloud.io/v1/XLM"
  HORIZON_URL="https://horizon.stellar.org"
  EXPLORER_BASE="https://stellar.expert/explorer/public/contract"

  # Safety gate: require explicit confirmation for mainnet
  echo ""
  echo "⚠️  WARNING: You are deploying to STELLAR MAINNET"
  echo "   This will use REAL XLM and create PERMANENT on-chain state."
  echo ""
  echo "   Pre-deploy checklist:"
  echo "   [ ] External audit approved and all fixes applied"
  echo "   [ ] 100% tests passing"
  echo "   [ ] Admin keypair from HSM/KMS (not .env)"
  echo "   [ ] Reward pool XLM calculated and funded"
  echo "   [ ] Rollback plan documented"
  echo ""
  read -r -p "Type 'deploy mainnet' to confirm: " CONFIRM
  if [ "$CONFIRM" != "deploy mainnet" ]; then
    echo "Aborted."
    exit 1
  fi
else
  NETWORK="testnet"
  NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
  RPC_URL="https://soroban-testnet.stellar.org"
  HORIZON_URL="https://horizon-testnet.stellar.org"
  EXPLORER_BASE="https://stellar.expert/explorer/testnet/contract"
fi

echo ""
echo "🌞 Tonalli — Soroban Contract Deployment"
echo "========================================="
echo "  Network: $NETWORK"
echo ""

# ── Configure network ─────────────────────────────────────────────────────────
echo "� Configuring network: $NETWORK"
stellar network add \
  --global "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" 2>/dev/null || true

# ── Admin keypair ─────────────────────────────────────────────────────────────
echo ""
echo "🔑 Configuring admin keypair..."

if [ -z "${ADMIN_SECRET:-}" ]; then
  if [ "$DEPLOY_ENV" = "mainnet" ]; then
    echo "❌ ADMIN_SECRET must be set for mainnet deployment."
    echo "   Load it from your HSM/KMS — do NOT store it in .env"
    echo "   Example: ADMIN_SECRET=\$(vault kv get -field=secret kv/tonalli/admin) ./deploy.sh"
    exit 1
  fi
  # Testnet only: generate or reuse a local keypair
  stellar keys generate --global tonalli-admin --network "$NETWORK" 2>/dev/null || true
  ADMIN_PUBLIC=$(stellar keys address tonalli-admin)
  echo "✅ Admin keypair (testnet): $ADMIN_PUBLIC"
  echo "⚠️  Secret: $(stellar keys show tonalli-admin 2>/dev/null || echo 'see ~/.config/stellar/identity/tonalli-admin.toml')"
else
  echo "$ADMIN_SECRET" | stellar keys add tonalli-admin --secret-key 2>/dev/null || true
  ADMIN_PUBLIC=$(stellar keys address tonalli-admin)
  echo "✅ Admin loaded from environment: $ADMIN_PUBLIC"
fi

# ── Fund account (testnet only) ───────────────────────────────────────────────
if [ "$DEPLOY_ENV" = "testnet" ]; then
  echo ""
  echo "� Funding account via Friendbot..."
  curl -s "https://friendbot.stellar.org?addr=$ADMIN_PUBLIC" > /dev/null \
    && echo "✅ Account funded" \
    || echo "⚠️  Friendbot failed (account may already have funds)"
fi

# ── Build contracts ───────────────────────────────────────────────────────────
echo ""
echo "🔨 Building Soroban contracts..."
cd "$(dirname "$0")"

stellar contract build 2>&1 | tail -5
echo "✅ Contracts built"

# ── Helper: deploy + initialize a contract ────────────────────────────────────
deploy_contract() {
  local WASM="$1"
  local LABEL="$2"

  echo ""
  echo "� Deploying $LABEL..."
  local CONTRACT_ID
  CONTRACT_ID=$(stellar contract deploy \
    --wasm "target/wasm32-unknown-unknown/release/${WASM}.wasm" \
    --source tonalli-admin \
    --network "$NETWORK" \
    2>&1 | grep -E "^C" | head -1)

  if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Failed to deploy $LABEL"
    exit 1
  fi

  echo "✅ $LABEL Contract ID: $CONTRACT_ID"
  echo "$CONTRACT_ID"
}

# ── Deploy NFT Certificate ────────────────────────────────────────────────────
NFT_CONTRACT_ID=$(deploy_contract "nft_certificate" "NFT Certificate")

echo "⚙️  Initializing NFT Certificate contract..."
stellar contract invoke \
  --id "$NFT_CONTRACT_ID" \
  --source tonalli-admin \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN_PUBLIC"
echo "✅ NFT Certificate initialized"

# ── Deploy Learn-to-Earn ──────────────────────────────────────────────────────
echo ""
echo "🔍 Resolving XLM Stellar Asset Contract (SAC)..."
XLM_SAC=$(stellar contract id asset \
  --asset native \
  --network "$NETWORK" 2>/dev/null || echo "")

if [ -z "$XLM_SAC" ]; then
  if [ "$DEPLOY_ENV" = "mainnet" ]; then
    # Mainnet native XLM SAC (well-known address)
    XLM_SAC="CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"
  else
    XLM_SAC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
  fi
  echo "⚠️  Using known SAC address: $XLM_SAC"
else
  echo "✅ XLM SAC: $XLM_SAC"
fi

REWARDS_CONTRACT_ID=$(deploy_contract "learn_to_earn" "Learn-to-Earn")

echo "⚙️  Initializing Learn-to-Earn contract..."
stellar contract invoke \
  --id "$REWARDS_CONTRACT_ID" \
  --source tonalli-admin \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN_PUBLIC" \
  --xlm_token "$XLM_SAC"

# Deposit initial XLM to reward pool
# Mainnet: use INITIAL_POOL_XLM env var (required); testnet: default 100 XLM
if [ "$DEPLOY_ENV" = "mainnet" ]; then
  if [ -z "${INITIAL_POOL_XLM:-}" ]; then
    echo "❌ INITIAL_POOL_XLM must be set for mainnet (amount in XLM, e.g. 500)"
    exit 1
  fi
  POOL_STROOPS=$(echo "$INITIAL_POOL_XLM * 10000000" | bc | cut -d. -f1)
  echo "💰 Depositing $INITIAL_POOL_XLM XLM ($POOL_STROOPS stroops) to reward pool..."
else
  POOL_STROOPS=1000000000  # 100 XLM for testnet
  echo "💰 Depositing 100 XLM to reward pool (testnet)..."
fi

stellar contract invoke \
  --id "$REWARDS_CONTRACT_ID" \
  --source tonalli-admin \
  --network "$NETWORK" \
  -- deposit \
  --from "$ADMIN_PUBLIC" \
  --amount "$POOL_STROOPS"

echo "✅ Learn-to-Earn initialized with reward pool"

# ── Deploy Podio NFT ──────────────────────────────────────────────────────────
PODIUM_NFT_CONTRACT_ID=$(deploy_contract "podio_nft" "Podio NFT")

echo "⚙️  Initializing Podio NFT contract..."
stellar contract invoke \
  --id "$PODIUM_NFT_CONTRACT_ID" \
  --source tonalli-admin \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN_PUBLIC"
echo "✅ Podio NFT initialized"

# ── Verify contracts on Stellar Expert ───────────────────────────────────────
echo ""
echo "🔍 Verifying contracts on Stellar Expert..."
echo "   NFT Certificate: $EXPLORER_BASE/$NFT_CONTRACT_ID"
echo "   Learn-to-Earn:   $EXPLORER_BASE/$REWARDS_CONTRACT_ID"
echo "   Podio NFT:       $EXPLORER_BASE/$PODIUM_NFT_CONTRACT_ID"
echo ""
echo "   Please verify each contract is visible and initialized before proceeding."

# ── Smoke test: mint 1 real certificate end-to-end ───────────────────────────
if [ "${RUN_SMOKE_TEST:-false}" = "true" ]; then
  echo ""
  echo "🧪 Running smoke test: minting 1 certificate end-to-end..."

  if [ -z "${SMOKE_TEST_USER:-}" ]; then
    echo "⚠️  SMOKE_TEST_USER not set — using admin address for smoke test"
    SMOKE_TEST_USER="$ADMIN_PUBLIC"
  fi

  SMOKE_TOKEN_ID=$(stellar contract invoke \
    --id "$NFT_CONTRACT_ID" \
    --source tonalli-admin \
    --network "$NETWORK" \
    -- mint \
    --to "$SMOKE_TEST_USER" \
    --lesson_id "smoke-test-mainnet-001" \
    --module_id "smoke-test" \
    --username "tonalli-smoke-test" \
    --score 100 \
    --xp_earned 50 \
    --metadata_uri "https://tonalli.app/certificates/smoke-test-mainnet-001" \
    2>&1 | tail -1)

  echo "✅ Smoke test certificate minted. Token ID: $SMOKE_TOKEN_ID"
  echo "   Verify at: $EXPLORER_BASE/$NFT_CONTRACT_ID"
fi

# ── Save configuration ────────────────────────────────────────────────────────
ENV_FILE="../.env.contracts"
if [ "$DEPLOY_ENV" = "mainnet" ]; then
  ENV_FILE="../.env.contracts.mainnet"
fi

echo ""
echo "💾 Saving configuration to $ENV_FILE..."
cat > "$ENV_FILE" << EOF
# Auto-generated by deploy.sh
# Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Network: $NETWORK
# DO NOT commit this file to version control

STELLAR_NETWORK=$NETWORK
STELLAR_SOROBAN_URL=$RPC_URL
STELLAR_HORIZON_URL=$HORIZON_URL
STELLAR_ADMIN_PUBLIC=$ADMIN_PUBLIC

# Deployed Soroban contract addresses
NFT_CONTRACT_ID=$NFT_CONTRACT_ID
REWARDS_CONTRACT_ID=$REWARDS_CONTRACT_ID
PODIUM_NFT_CONTRACT_ID=$PODIUM_NFT_CONTRACT_ID

# XLM Stellar Asset Contract (SAC)
XLM_SAC_ADDRESS=$XLM_SAC
EOF

echo "✅ Configuration saved to $ENV_FILE"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "🎉 Deployment complete!"
echo "========================================="
echo ""
echo "  Network:             $NETWORK"
echo "  Admin:               $ADMIN_PUBLIC"
echo "  NFT Contract:        $NFT_CONTRACT_ID"
echo "  Rewards Contract:    $REWARDS_CONTRACT_ID"
echo "  Podium NFT Contract: $PODIUM_NFT_CONTRACT_ID"
echo ""
echo "  Add to your backend .env:"
echo "  STELLAR_NETWORK=$NETWORK"
echo "  STELLAR_SOROBAN_URL=$RPC_URL"
echo "  STELLAR_HORIZON_URL=$HORIZON_URL"
echo "  NFT_CONTRACT_ID=$NFT_CONTRACT_ID"
echo "  REWARDS_CONTRACT_ID=$REWARDS_CONTRACT_ID"
echo "  PODIUM_NFT_CONTRACT_ID=$PODIUM_NFT_CONTRACT_ID"
echo "  STELLAR_ADMIN_SECRET=<load-from-hsm-kms>"
echo ""
echo "  Explorer:"
echo "  $EXPLORER_BASE/$NFT_CONTRACT_ID"
echo "  $EXPLORER_BASE/$REWARDS_CONTRACT_ID"
echo "  $EXPLORER_BASE/$PODIUM_NFT_CONTRACT_ID"
echo ""
if [ "$DEPLOY_ENV" = "mainnet" ]; then
  echo "  ⚠️  MAINNET deployment. Rotate ADMIN_SECRET in HSM/KMS if needed."
  echo "  ⚠️  Monitor reward pool balance regularly."
fi
