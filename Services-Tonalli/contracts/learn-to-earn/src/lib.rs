//! # Tonalli Learn-to-Earn Contract (Soroban)
//!
//! Gestiona las recompensas en XLM para usuarios que completan lecciones.
//! Mantiene un registro on-chain de recompensas entregadas y permite
//! al backend de Tonalli distribuir XLM de forma verificable.
//!
//! ## Flujo:
//! 1. Backend llama `reward_user(user, lesson_id, amount)` al completar lección
//! 2. Contrato registra la recompensa on-chain
//! 3. Contrato transfiere XLM nativo desde el pool del contrato
//! 4. Evento emitido para trazabilidad pública

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Symbol, String, Vec, Map,
    symbol_short, token, log,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const TOKEN_KEY: Symbol = symbol_short!("TOKEN");    // XLM token contract
const TOTAL_KEY: Symbol = symbol_short!("TOTAL");    // Total XLM rewarded

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    UserRewards(Address),           // owner → total XLM rewarded (in stroops)
    LessonRewarded(Address, String), // (user, lesson_id) → bool (anti-double-claim)
    RewardHistory(Address),         // owner → Vec<RewardRecord>
}

// ─── Data Structures ─────────────────────────────────────────────────────────

/// Registro de una recompensa entregada
#[contracttype]
#[derive(Clone, Debug)]
pub struct RewardRecord {
    /// Lección que generó la recompensa
    pub lesson_id: String,
    /// Cantidad en stroops (1 XLM = 10_000_000 stroops)
    pub amount: i128,
    /// Timestamp de la entrega
    pub timestamp: u64,
}

/// Configuración de recompensa por tipo de lección
#[contracttype]
#[derive(Clone, Debug)]
pub struct LessonRewardConfig {
    /// Recompensa base en stroops
    pub base_reward: i128,
    /// Bonus por score perfecto (100/100)
    pub perfect_bonus: i128,
    /// Score mínimo para recibir recompensa
    pub min_score: u32,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct LearnToEarnContract;

#[contractimpl]
impl LearnToEarnContract {

    // ── Inicialización ────────────────────────────────────────────────────────

    /// Inicializa el contrato con admin y dirección del token XLM nativo
    /// En Stellar, XLM nativo tiene la dirección especial del Stellar Asset Contract
    pub fn initialize(env: Env, admin: Address, xlm_token: Address) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&TOKEN_KEY, &xlm_token);
        env.storage().instance().set(&TOTAL_KEY, &0i128);
        log!(&env, "Tonalli Learn-to-Earn Contract initialized");
    }

    // ── Recompensas ───────────────────────────────────────────────────────────

    /// Recompensa a un usuario por completar una lección.
    /// Solo el admin (backend de Tonalli) puede llamar esta función.
    ///
    /// # Parámetros
    /// - `user`: Dirección del usuario que completó la lección
    /// - `lesson_id`: ID único de la lección
    /// - `amount`: Cantidad a recompensar en stroops (ej. 5_000_000 = 0.5 XLM)
    /// - `score`: Score del quiz para calcular bonus
    pub fn reward_user(
        env: Env,
        user: Address,
        lesson_id: String,
        amount: i128,
        score: u32,
    ) -> i128 {
        // Solo el admin puede distribuir recompensas
        let admin: Address = env.storage().instance().get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();

        // Anti-double-claim: verificar que no se haya recompensado ya esta lección
        let reward_key = DataKey::LessonRewarded(user.clone(), lesson_id.clone());
        if env.storage().persistent().has(&reward_key) {
            panic!("User already rewarded for this lesson");
        }

        // Calcular recompensa con bonus por score perfecto
        let final_amount = if score == 100 {
            amount + (amount / 10) // +10% bonus por score perfecto
        } else {
            amount
        };

        // Transferir XLM al usuario usando el Stellar Asset Contract (SAC)
        let xlm_token: Address = env.storage().instance().get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &user, &final_amount);

        // Marcar lección como recompensada (anti-double-claim)
        env.storage().persistent().set(&reward_key, &true);

        // Actualizar total de recompensas del usuario
        let user_key = DataKey::UserRewards(user.clone());
        let user_total: i128 = env.storage().persistent()
            .get(&user_key).unwrap_or(0);
        env.storage().persistent().set(&user_key, &(user_total + final_amount));

        // Actualizar historial del usuario
        let history_key = DataKey::RewardHistory(user.clone());
        let mut history: Vec<RewardRecord> = env.storage().persistent()
            .get(&history_key)
            .unwrap_or(Vec::new(&env));
        history.push_back(RewardRecord {
            lesson_id: lesson_id.clone(),
            amount: final_amount,
            timestamp: env.ledger().timestamp(),
        });
        env.storage().persistent().set(&history_key, &history);

        // Actualizar total global
        let total: i128 = env.storage().instance().get(&TOTAL_KEY).unwrap_or(0);
        env.storage().instance().set(&TOTAL_KEY, &(total + final_amount));

        // Emitir evento trazable
        env.events().publish(
            (Symbol::new(&env, "reward"), user.clone()),
            (lesson_id, final_amount, score),
        );

        log!(&env, "Reward sent: {} stroops to {}", final_amount, user);

        final_amount
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    /// Total de XLM (en stroops) recibido por un usuario
    pub fn get_user_total_rewards(env: Env, user: Address) -> i128 {
        env.storage().persistent()
            .get(&DataKey::UserRewards(user))
            .unwrap_or(0)
    }

    /// Historial de recompensas de un usuario
    pub fn get_reward_history(env: Env, user: Address) -> Vec<RewardRecord> {
        env.storage().persistent()
            .get(&DataKey::RewardHistory(user))
            .unwrap_or(Vec::new(&env))
    }

    /// Verifica si el usuario ya fue recompensado por una lección
    pub fn is_lesson_rewarded(env: Env, user: Address, lesson_id: String) -> bool {
        env.storage().persistent()
            .has(&DataKey::LessonRewarded(user, lesson_id))
    }

    /// Total global de XLM distribuido por el contrato (en stroops)
    pub fn total_distributed(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_KEY).unwrap_or(0)
    }

    /// Balance de XLM disponible en el pool del contrato
    pub fn pool_balance(env: Env) -> i128 {
        let xlm_token: Address = env.storage().instance().get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.balance(&env.current_contract_address())
    }

    /// Admin puede depositar XLM al pool del contrato para recompensas
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let xlm_token: Address = env.storage().instance().get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);
        log!(&env, "Pool deposit: {} stroops from {}", amount, from);
    }

    /// Admin puede retirar XLM del pool (emergencia)
    pub fn withdraw(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();
        let xlm_token: Address = env.storage().instance().get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &to, &amount);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN_KEY)
            .expect("Contract not initialized")
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, MockAuth, MockAuthInvoke},
        token::{Client as TokenClient, StellarAssetClient},
        Env, Address, String,
    };

    fn setup() -> (Env, Address, Address, Address, LearnToEarnContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        // Crear token XLM de prueba
        let token_admin = Address::generate(&env);
        let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
        let xlm_token = token_contract_id.address();

        // Registrar contrato
        let contract_id = env.register_contract(None, LearnToEarnContract);
        let client = LearnToEarnContractClient::new(&env, &contract_id);

        // Inicializar
        client.initialize(&admin, &xlm_token);

        // Fondear el pool del contrato
        let sac_client = StellarAssetClient::new(&env, &xlm_token);
        sac_client.mint(&contract_id, &100_000_000); // 10 XLM al pool

        (env, admin, user, xlm_token, client)
    }

    #[test]
    fn test_reward_user() {
        let (env, _admin, user, _xlm, client) = setup();

        let amount = client.reward_user(
            &user,
            &String::from_str(&env, "lesson-01"),
            &5_000_000i128, // 0.5 XLM
            &80,
        );

        assert_eq!(amount, 5_000_000);
        assert_eq!(client.get_user_total_rewards(&user), 5_000_000);
        assert_eq!(client.total_distributed(), 5_000_000);
    }

    #[test]
    fn test_perfect_score_bonus() {
        let (env, _admin, user, _xlm, client) = setup();

        let amount = client.reward_user(
            &user,
            &String::from_str(&env, "lesson-01"),
            &5_000_000i128,
            &100, // score perfecto → +10%
        );

        assert_eq!(amount, 5_500_000); // 0.55 XLM con bonus
    }

    #[test]
    #[should_panic(expected = "User already rewarded for this lesson")]
    fn test_anti_double_claim() {
        let (env, _admin, user, _xlm, client) = setup();

        client.reward_user(
            &user,
            &String::from_str(&env, "lesson-01"),
            &5_000_000i128,
            &80,
        );
        // Segunda vez debe fallar
        client.reward_user(
            &user,
            &String::from_str(&env, "lesson-01"),
            &5_000_000i128,
            &80,
        );
    }

    #[test]
    fn test_reward_history() {
        let (env, _admin, user, _xlm, client) = setup();

        client.reward_user(&user, &String::from_str(&env, "lesson-01"), &5_000_000, &80);
        client.reward_user(&user, &String::from_str(&env, "lesson-02"), &5_000_000, &90);

        let history = client.get_reward_history(&user);
        assert_eq!(history.len(), 2);
    }

    #[test]
    fn test_deposit() {
        let (env, admin, user, xlm_token, client) = setup();

        // Deposit additional XLM
        let sac_client = StellarAssetClient::new(&env, &xlm_token);
        sac_client.mint(&admin, &10_000_000); // 1 XLM to admin

        let initial_balance = client.pool_balance();
        client.deposit(&admin, &5_000_000); // 0.5 XLM deposit
        assert_eq!(client.pool_balance(), initial_balance + 5_000_000);
    }

    #[test]
    fn test_withdraw() {
        let (env, admin, user, xlm_token, client) = setup();

        let initial_balance = client.pool_balance();
        client.withdraw(&admin, &5_000_000); // 0.5 XLM withdraw
        assert_eq!(client.pool_balance(), initial_balance - 5_000_000);
    }

    #[test]
    fn test_pool_balance() {
        let (env, _admin, _user, _xlm, client) = setup();
        let balance = client.pool_balance();
        assert_eq!(balance, 100_000_000); // 10 XLM initial mint
    }

    #[test]
    fn test_is_lesson_rewarded() {
        let (env, _admin, user, _xlm, client) = setup();

        assert!(!client.is_lesson_rewarded(&user, &String::from_str(&env, "lesson-01")));

        client.reward_user(&user, &String::from_str(&env, "lesson-01"), &5_000_000, &80);

        assert!(client.is_lesson_rewarded(&user, &String::from_str(&env, "lesson-01")));
        assert!(!client.is_lesson_rewarded(&user, &String::from_str(&env, "lesson-02")));
    }

    #[test]
    fn test_total_distributed() {
        let (env, _admin, user, _xlm, client) = setup();

        client.reward_user(&user, &String::from_str(&env, "lesson-01"), &5_000_000, &80);
        client.reward_user(&user, &String::from_str(&env, "lesson-02"), &5_000_000, &90);

        assert_eq!(client.total_distributed(), 10_000_000);
    }

    #[test]
    #[should_panic(expected = "Contract already initialized")]
    fn test_double_initialize_fails() {
        let (env, admin, _user, xlm_token, client) = setup();
        client.initialize(&admin, &xlm_token);
    }
}
