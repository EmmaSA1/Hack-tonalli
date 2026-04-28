#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Tonalli — Deploy Soroban Contracts to Stellar Testnet
# ─────────────────────────────────────────────────────────────────────────────
# Requisitos:
#   - Rust + cargo instalados: https://rustup.rs
#   - Soroban CLI: cargo install --locked soroban-cli
#   - stellar CLI: cargo install stellar-cli (v21+)
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "🌞 Tonalli — Soroban Contract Deployment"
echo "========================================="

NETWORK="testnet"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
RPC_URL="https://soroban-testnet.stellar.org"
HORIZON_URL="https://horizon-testnet.stellar.org"

# ── Configurar red ────────────────────────────────────────────────────────────
echo ""
echo "📡 Configurando red: $NETWORK"
stellar network add \
  --global $NETWORK \
  --rpc-url $RPC_URL \
  --network-passphrase "$NETWORK_PASSPHRASE" 2>/dev/null || true

# ── Crear/cargar keypair del admin ────────────────────────────────────────────
echo ""
echo "🔑 Configurando keypair admin..."

if [ -z "$ADMIN_SECRET" ]; then
  # Generar nuevo keypair si no existe
  stellar keys generate --global tonalli-admin --network $NETWORK 2>/dev/null || true
  ADMIN_PUBLIC=$(stellar keys address tonalli-admin)
  echo "✅ Admin keypair: $ADMIN_PUBLIC"
  echo "⚠️  Guarda el secret key: $(stellar keys show tonalli-admin 2>/dev/null || echo 'ver en ~/.config/stellar/identity/tonalli-admin.toml')"
else
  # Usar secret key de entorno
  echo "$ADMIN_SECRET" | stellar keys add tonalli-admin --secret-key 2>/dev/null || true
  ADMIN_PUBLIC=$(stellar keys address tonalli-admin)
  echo "✅ Admin desde variable de entorno: $ADMIN_PUBLIC"
fi

# Upgrade multisig admins (2-of-3 with admin + two guardians)
echo ""
echo "🛡️  Configurando guardians de upgrade..."
stellar keys generate --global tonalli-guardian-2 --network $NETWORK 2>/dev/null || true
stellar keys generate --global tonalli-guardian-3 --network $NETWORK 2>/dev/null || true
UPGRADE_ADMIN_2=$(stellar keys address tonalli-guardian-2)
UPGRADE_ADMIN_3=$(stellar keys address tonalli-guardian-3)
echo "✅ Upgrade admins: $ADMIN_PUBLIC, $UPGRADE_ADMIN_2, $UPGRADE_ADMIN_3"

# Fondear con Friendbot (solo testnet)
echo ""
echo "💧 Fondeando cuenta con Friendbot..."
curl -s "https://friendbot.stellar.org?addr=$ADMIN_PUBLIC" > /dev/null && echo "✅ Cuenta fondeada" || echo "⚠️  Friendbot falló (puede que ya tenga fondos)"

# ── Compilar contratos ────────────────────────────────────────────────────────
echo ""
echo "🔨 Compilando contratos Soroban..."
cd "$(dirname "$0")"

stellar contract build 2>&1 | tail -5
echo "✅ Contratos compilados"

# ── Deploy NFT Certificate Contract ───────────────────────────────────────────
echo ""
echo "🚀 Desplegando NFT Certificate Contract..."
NFT_CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nft_certificate.wasm \
  --source tonalli-admin \
  --network $NETWORK \
  2>&1 | grep -E "^C" | head -1)

echo "✅ NFT Contract ID: $NFT_CONTRACT_ID"

# Inicializar NFT contract
echo "⚙️  Inicializando NFT contract..."
stellar contract invoke \
  --id $NFT_CONTRACT_ID \
  --source tonalli-admin \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_PUBLIC \
  --upgrade_admin_2 $UPGRADE_ADMIN_2 \
  --upgrade_admin_3 $UPGRADE_ADMIN_3

echo "✅ NFT contract inicializado"

# ── Deploy Learn-to-Earn Contract ─────────────────────────────────────────────
echo ""
echo "🚀 Desplegando Learn-to-Earn Contract..."

# Obtener dirección del Stellar Asset Contract (SAC) para XLM nativo en testnet
XLM_SAC=$(stellar contract id asset \
  --asset native \
  --network $NETWORK 2>/dev/null || echo "")

if [ -z "$XLM_SAC" ]; then
  echo "⚠️  No se pudo obtener SAC de XLM nativo, usando dirección conocida de testnet"
  XLM_SAC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
fi

echo "💱 XLM SAC: $XLM_SAC"

REWARDS_CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/learn_to_earn.wasm \
  --source tonalli-admin \
  --network $NETWORK \
  2>&1 | grep -E "^C" | head -1)

echo "✅ Rewards Contract ID: $REWARDS_CONTRACT_ID"

# Inicializar Rewards contract
echo "⚙️  Inicializando Rewards contract..."
stellar contract invoke \
  --id $REWARDS_CONTRACT_ID \
  --source tonalli-admin \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_PUBLIC \
  --xlm_token $XLM_SAC \
  --upgrade_admin_2 $UPGRADE_ADMIN_2 \
  --upgrade_admin_3 $UPGRADE_ADMIN_3

# Depositar XLM inicial al pool de recompensas (10 XLM)
echo "💰 Depositando 100 XLM al pool de recompensas..."
stellar contract invoke \
  --id $REWARDS_CONTRACT_ID \
  --source tonalli-admin \
  --network $NETWORK \
  -- deposit \
  --from $ADMIN_PUBLIC \
  --amount 1000000000 # 100 XLM en stroops

echo "✅ Rewards contract inicializado con pool de XLM"

# ── Deploy Podio NFT Contract ────────────────────────────────────────────────
echo ""
echo "🚀 Desplegando Podio NFT Contract..."
PODIUM_NFT_CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/podio_nft.wasm \
  --source tonalli-admin \
  --network $NETWORK \
  2>&1 | grep -E "^C" | head -1)

echo "✅ Podium NFT Contract ID: $PODIUM_NFT_CONTRACT_ID"

# Inicializar Podio NFT contract
echo "⚙️  Inicializando Podio NFT contract..."
stellar contract invoke \
  --id $PODIUM_NFT_CONTRACT_ID \
  --source tonalli-admin \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_PUBLIC

echo "✅ Podium NFT contract inicializado"

# ── Guardar configuración ─────────────────────────────────────────────────────
echo ""
echo "💾 Guardando configuración en .env.contracts..."
cat > "../.env.contracts" << EOF
# Generado automáticamente por deploy.sh
# Fecha: $(date)
# Red: $NETWORK

STELLAR_NETWORK=$NETWORK
STELLAR_SOROBAN_URL=$RPC_URL
STELLAR_HORIZON_URL=$HORIZON_URL
STELLAR_ADMIN_PUBLIC=$ADMIN_PUBLIC

# Contratos Soroban desplegados
NFT_CONTRACT_ID=$NFT_CONTRACT_ID
REWARDS_CONTRACT_ID=$REWARDS_CONTRACT_ID
PODIUM_NFT_CONTRACT_ID=$PODIUM_NFT_CONTRACT_ID
UPGRADE_ADMIN_2=$UPGRADE_ADMIN_2
UPGRADE_ADMIN_3=$UPGRADE_ADMIN_3

# XLM Stellar Asset Contract (SAC)
XLM_SAC_ADDRESS=$XLM_SAC
EOF

echo "✅ Configuración guardada en .env.contracts"

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "🎉 ¡Deployment completado exitosamente!"
echo "========================================="
echo ""
echo "  NFT Contract:        $NFT_CONTRACT_ID"
echo "  Rewards Contract:    $REWARDS_CONTRACT_ID"
echo "  Podium NFT Contract: $PODIUM_NFT_CONTRACT_ID"
echo "  Admin:               $ADMIN_PUBLIC"
echo "  Red:                 $NETWORK"
echo ""
echo "  Agrega estas variables a tu .env del backend:"
echo "  NFT_CONTRACT_ID=$NFT_CONTRACT_ID"
echo "  REWARDS_CONTRACT_ID=$REWARDS_CONTRACT_ID"
echo "  PODIUM_NFT_CONTRACT_ID=$PODIUM_NFT_CONTRACT_ID"
echo "  STELLAR_ADMIN_SECRET=<tu-secret-key>"
echo ""
echo "  Explorador:"
echo "  https://stellar.expert/explorer/testnet/contract/$NFT_CONTRACT_ID"
echo "  https://stellar.expert/explorer/testnet/contract/$REWARDS_CONTRACT_ID"
echo "  https://stellar.expert/explorer/testnet/contract/$PODIUM_NFT_CONTRACT_ID"
echo ""
