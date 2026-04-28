//! # Tonalli Smart Contract Interfaces
//!
//! Interfaces (traits) para los smart contracts de Tonalli.
//! Solo se usan en el Podio y Rewards — las certificaciones son manejadas por ACTA.
//!
//! ## Contratos:
//! - `ILearnToEarn` — Distribucion de recompensas XLM por completar cursos
//! - `IPodioNft`    — NFTs conmemorativos para ganadores del podio semanal

#![no_std]

use soroban_sdk::{Address, BytesN, Env, String, Vec};

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS COMPARTIDOS
// ═══════════════════════════════════════════════════════════════════════════════

/// Registro de una recompensa entregada on-chain
#[soroban_sdk::contracttype]
#[derive(Clone, Debug)]
pub struct RewardRecord {
    /// ID del curso (id_curso / chapter UUID)
    pub lesson_id: String,
    /// Cantidad en stroops (1 XLM = 10_000_000 stroops)
    pub amount: i128,
    /// Timestamp de la entrega (ledger timestamp)
    pub timestamp: u64,
}

/// NFT conmemorativo del podio semanal
#[soroban_sdk::contracttype]
#[derive(Clone, Debug)]
pub struct PodiumNFT {
    /// Posicion en el podio (1, 2, o 3)
    pub rank: u32,
    /// Recompensa en XLM en stroops
    pub xlm_reward: u64,
    /// Semana del podio (ej. "2026-W12")
    pub week: String,
    /// Hash de la transaccion XLM de recompensa
    pub tx_hash: String,
    /// Timestamp de emision
    pub issued_at: u64,
    /// Direccion del ganador
    pub owner: Address,
}

/// Relacion usuario-curso para tracking de progreso on-chain
#[soroban_sdk::contracttype]
#[derive(Clone, Debug)]
pub struct UserCourseEntry {
    /// Direccion Stellar del usuario
    pub user: Address,
    /// ID del curso (id_curso)
    pub id_curso: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE: LEARN-TO-EARN REWARDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Interface del contrato de recompensas Learn-to-Earn.
///
/// Gestiona un pool de XLM que se distribuye a usuarios al completar cursos.
/// Incluye proteccion anti-doble-claim y bonus por score perfecto.
///
/// ## Flujo:
/// ```text
/// Usuario aprueba quiz → Backend llama reward_user() → XLM al wallet del usuario
/// ```
pub trait ILearnToEarn {

    // ── Inicializacion ──────────────────────────────────────────────────────

    /// Inicializa el contrato con la cuenta admin y el token XLM (SAC).
    /// Solo se puede llamar una vez.
    ///
    /// # Parametros
    /// - `admin`: Cuenta Stellar del administrador (backend Tonalli)
    /// - `xlm_token`: Direccion del Stellar Asset Contract de XLM nativo
    fn initialize(
        env: Env,
        admin: Address,
        xlm_token: Address,
        upgrade_admin_2: Address,
        upgrade_admin_3: Address,
    );

    // ── Recompensas ─────────────────────────────────────────────────────────

    /// Recompensa a un usuario por completar un curso/modulo.
    /// Solo el admin puede llamar esta funcion.
    ///
    /// # Parametros
    /// - `user`: Wallet Stellar del estudiante
    /// - `lesson_id`: ID del curso (id_curso) — UUID del Chapter
    /// - `amount`: Cantidad en stroops (ej. 5_000_000 = 0.5 XLM)
    /// - `score`: Puntuacion del quiz (0-100). Si es 100, aplica bonus +10%
    ///
    /// # Retorna
    /// Cantidad final enviada en stroops (puede ser mayor si hubo bonus)
    ///
    /// # Errores
    /// - Panic si el contrato no esta inicializado
    /// - Panic si el caller no es admin
    /// - Panic si el usuario ya fue recompensado por este id_curso (anti-doble-claim)
    /// - Panic si no hay balance suficiente en el pool
    fn reward_user(
        env: Env,
        user: Address,
        lesson_id: String,
        amount: i128,
        score: u32,
    ) -> i128;

    // ── Consultas ───────────────────────────────────────────────────────────

    /// Total de XLM (stroops) recibido por un usuario en todos sus cursos.
    fn get_user_total_rewards(env: Env, user: Address) -> i128;

    /// Historial de recompensas de un usuario.
    /// Retorna array de: [{ lesson_id (id_curso), amount, timestamp }]
    fn get_reward_history(env: Env, user: Address) -> Vec<RewardRecord>;

    /// Verifica si el usuario ya fue recompensado por un curso especifico.
    /// Usado para anti-doble-claim.
    ///
    /// # Parametros
    /// - `user`: Wallet Stellar del estudiante
    /// - `lesson_id`: ID del curso (id_curso)
    fn is_lesson_rewarded(env: Env, user: Address, lesson_id: String) -> bool;

    /// Total global de XLM distribuido por el contrato (stroops).
    fn total_distributed(env: Env) -> i128;

    /// Balance de XLM disponible en el pool del contrato.
    fn pool_balance(env: Env) -> i128;

    // ── Admin: Pool ─────────────────────────────────────────────────────────

    /// Deposita XLM al pool de recompensas.
    /// Cualquier cuenta puede depositar (requiere auth del depositor).
    fn deposit(env: Env, from: Address, amount: i128);

    /// Retira XLM del pool (emergencia). Solo admin.
    fn withdraw(env: Env, to: Address, amount: i128);

    /// Pausa distribución de recompensas. Solo admin.
    fn pause(env: Env);

    /// Reanuda distribución de recompensas. Solo admin.
    fn unpause(env: Env);

    /// Estado de pausa.
    fn is_paused(env: Env) -> bool;

    /// Rescate de fondos del pool. Solo admin.
    fn emergency_withdraw(env: Env, admin: Address, to: Address, amount: i128);

    /// Upgrade de contrato con aprobación 2-of-3.
    fn upgrade(env: Env, approvers: Vec<Address>, new_wasm_hash: BytesN<32>);

    /// Retorna la direccion del admin actual.
    fn admin(env: Env) -> Address;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE: PODIO NFT
// ═══════════════════════════════════════════════════════════════════════════════

/// Interface del contrato de NFTs del Podio Semanal.
///
/// Emite NFTs conmemorativos para los 3 ganadores del ranking semanal.
/// Cada NFT registra: posicion, recompensa XLM, semana, y txHash.
///
/// ## Flujo:
/// ```text
/// Domingo 23:59 → Cron cierra podio → Top 3 reciben XLM + NFT on-chain
/// ```
///
/// ## Reglas:
/// - Solo usuarios con plan Pro o Max participan
/// - Solo se puede emitir 1 NFT por (semana + usuario)
/// - Rank valido: 1, 2, o 3
pub trait IPodioNft {

    // ── Inicializacion ──────────────────────────────────────────────────────

    /// Inicializa el contrato con la cuenta admin.
    /// Solo se puede llamar una vez.
    fn initialize(env: Env, admin: Address);

    // ── Mint ────────────────────────────────────────────────────────────────

    /// Emite un NFT de podio para un ganador semanal. Solo admin.
    ///
    /// # Parametros
    /// - `week`: Identificador de semana (ej. "2026-W12")
    /// - `address`: Wallet Stellar del ganador
    /// - `rank`: Posicion en el podio (1, 2, o 3)
    /// - `xlm_reward`: Recompensa en stroops
    /// - `tx_hash`: Hash de la transaccion de pago XLM
    ///
    /// # Errores
    /// - Panic si rank no es 1, 2, o 3
    /// - Panic si ya existe NFT para esta (semana + address)
    /// - Panic si el caller no es admin
    fn mint_podium_nft(
        env: Env,
        week: String,
        address: Address,
        rank: u32,
        xlm_reward: u64,
        tx_hash: String,
    );

    // ── Consultas ───────────────────────────────────────────────────────────

    /// Obtiene el NFT de podio de un usuario para una semana especifica.
    /// Retorna None si no existe.
    fn get_podium_nft(env: Env, week: String, address: Address) -> Option<PodiumNFT>;

    /// Verifica si un usuario tiene NFT de podio para una semana.
    fn has_nft(env: Env, week: String, address: Address) -> bool;

    /// Retorna la direccion del admin actual.
    fn admin(env: Env) -> Address;

    // ── Admin ───────────────────────────────────────────────────────────────

    /// Transfiere derechos de admin a una nueva direccion. Solo admin.
    fn transfer_admin(env: Env, new_admin: Address);
}
