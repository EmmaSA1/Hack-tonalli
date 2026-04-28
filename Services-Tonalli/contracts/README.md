# Tonalli — Smart Contracts (Soroban / Stellar)

Contratos inteligentes escritos en **Rust** usando el SDK de **Soroban** (plataforma de contratos inteligentes de Stellar).

## Contratos

### 1. `nft-certificate` — Certificados NFT
Emite un NFT on-chain cuando un usuario completa una lección.

| Función | Descripción |
|---|---|
| `initialize(admin, upgrade_admin_2, upgrade_admin_3)` | Configura admin operativo y multisig de upgrades |
| `mint(to, lesson_id, module_id, username, score, xp, metadata_uri)` | Emite NFT certificado |
| `get_certificate(token_id)` | Consulta datos de un certificado |
| `get_user_certificates(owner)` | Lista todos los certificados de un usuario |
| `has_certificate(owner, lesson_id)` | ¿Tiene el usuario este certificado? |
| `total_supply()` | Total de NFTs emitidos |
| `upgrade(approvers, new_wasm_hash)` | Upgrade WASM con aprobación 2-de-3 |

### 2. `learn-to-earn` — Recompensas XLM
Distribuye recompensas en XLM de forma verificable on-chain con anti-double-claim.

| Función | Descripción |
|---|---|
| `initialize(admin, xlm_token, upgrade_admin_2, upgrade_admin_3)` | Configura admin, token y multisig de upgrades |
| `reward_user(user, lesson_id, amount, score)` | Envía XLM al usuario |
| `deposit(from, amount)` | Admin deposita XLM al pool |
| `pause()` / `unpause()` | Pausa/reanuda distribución de recompensas |
| `emergency_withdraw(admin, to, amount)` | Rescate de fondos del pool |
| `get_user_total_rewards(user)` | Total XLM recibido por usuario |
| `get_reward_history(user)` | Historial de recompensas |
| `is_lesson_rewarded(user, lesson_id)` | Anti-double-claim check |
| `pool_balance()` | Balance disponible en el pool |
| `upgrade(approvers, new_wasm_hash)` | Upgrade WASM con aprobación 2-de-3 |

## Setup

### 1. Instalar Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

### 2. Instalar Stellar CLI (incluye Soroban)
```bash
cargo install --locked stellar-cli@21 --features opt
```

### 3. Compilar contratos
```bash
cd contracts/
stellar contract build
```

Los WASM compilados quedan en:
- `target/wasm32-unknown-unknown/release/nft_certificate.wasm`
- `target/wasm32-unknown-unknown/release/learn_to_earn.wasm`

### 4. Ejecutar tests
```bash
# Test de nft-certificate
cd nft-certificate && cargo test

# Test de learn-to-earn
cd learn-to-earn && cargo test
```

### 5. Deploy a Testnet
```bash
chmod +x contracts/deploy.sh
./contracts/deploy.sh
```

El script automáticamente:
1. Crea/carga keypair admin
2. Fondea con Friendbot
3. Compila los contratos
4. Despliega ambos contratos
5. Los inicializa
6. Deposita XLM al pool de recompensas
7. Guarda los contract IDs en `.env.contracts`

## Variables de entorno necesarias en el backend

```env
# Soroban
STELLAR_SOROBAN_URL=https://soroban-testnet.stellar.org
STELLAR_ADMIN_SECRET=S...        # Secret key del admin
NFT_CONTRACT_ID=C...             # ID del contrato nft-certificate desplegado
REWARDS_CONTRACT_ID=C...         # ID del contrato learn-to-earn desplegado
```

## Arquitectura del flujo on-chain

```
Usuario completa quiz
        │
        ▼
NestJS valida respuestas
        │
        ├──► SorobanService.mintCertificate()
        │           │
        │           └──► Contrato nft-certificate.mint()
        │                       │
        │                       └──► NFT emitido on-chain ✅
        │
        └──► SorobanService.rewardUser()
                    │
                    └──► Contrato learn-to-earn.reward_user()
                                │
                                └──► XLM transferido al usuario ✅
```

## Explorador Testnet

Una vez desplegados, ver los contratos en:
- `https://stellar.expert/explorer/testnet/contract/{CONTRACT_ID}`

## Notas para el Hackathon

- Los contratos funcionan en **modo mock** si `NFT_CONTRACT_ID` / `REWARDS_CONTRACT_ID` no están configurados
- El mock simula la respuesta correctamente para el demo
- Para el demo real, ejecutar `./contracts/deploy.sh` antes de la presentación
