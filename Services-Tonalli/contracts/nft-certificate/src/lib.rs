//! # Tonalli NFT Certificate Contract (Soroban)
//!
//! Emite certificados NFT on-chain en Stellar cuando un usuario
//! completa una lección en la plataforma Tonalli.
//!
//! ## Funciones principales:
//! - `initialize(admin)` — configura el contrato
//! - `mint(to, lesson_id, metadata)` — emite un certificado NFT
//! - `get_certificate(token_id)` — consulta un certificado
//! - `get_user_certificates(owner)` — lista certificados de un usuario
//! - `total_supply()` — total de NFTs emitidos

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Map, String, Vec, Symbol, symbol_short,
    log,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const COUNTER_KEY: Symbol = symbol_short!("COUNTER");

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Certificate(u64),           // token_id → CertificateData
    UserCertificates(Address),  // owner → Vec<token_id>
    Approved(u64),              // token_id → approved_address
}

// ─── Data Structures ─────────────────────────────────────────────────────────

/// Datos del certificado NFT emitido al completar una lección
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct CertificateData {
    /// Wallet del usuario que completó la lección
    pub owner: Address,
    /// ID de la lección completada (ej. "intro-blockchain-01")
    pub lesson_id: String,
    /// Módulo al que pertenece la lección
    pub module_id: String,
    /// Nombre del usuario en la plataforma
    pub username: String,
    /// Puntuación obtenida en el quiz (0-100)
    pub score: u32,
    /// XP ganado al completar la lección
    pub xp_earned: u32,
    /// Timestamp de emisión (ledger timestamp)
    pub issued_at: u64,
    /// Metadata adicional (IPFS hash o JSON con imagen del personaje)
    pub metadata_uri: String,
    /// Token ID único
    pub token_id: u64,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct NftCertificateContract;

#[contractimpl]
impl NftCertificateContract {

    // ── Inicialización ────────────────────────────────────────────────────────

    /// Inicializa el contrato con la dirección del administrador (backend de Tonalli)
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&COUNTER_KEY, &0u64);
        log!(&env, "Tonalli NFT Certificate Contract initialized. Admin: {}", admin);
    }

    // ── Mint ─────────────────────────────────────────────────────────────────

    /// Emite un certificado NFT cuando el usuario completa una lección.
    /// Solo puede ser llamado por el admin (backend de Tonalli).
    ///
    /// # Parámetros
    /// - `to`: Dirección Stellar del usuario
    /// - `lesson_id`: ID único de la lección completada
    /// - `module_id`: ID del módulo
    /// - `username`: Nombre del usuario en Tonalli
    /// - `score`: Puntuación en el quiz (0-100)
    /// - `xp_earned`: XP ganado
    /// - `metadata_uri`: URI de metadata (IPFS o data URI)
    ///
    /// # Returns
    /// El token_id del certificado emitido
    pub fn mint(
        env: Env,
        to: Address,
        lesson_id: String,
        module_id: String,
        username: String,
        score: u32,
        xp_earned: u32,
        metadata_uri: String,
    ) -> u64 {
        // Solo el admin puede emitir certificados
        let admin: Address = env.storage().instance().get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();

        // Validaciones
        if score > 100 {
            panic!("Score must be between 0 and 100");
        }

        // Incrementar contador de tokens
        let mut counter: u64 = env.storage().instance().get(&COUNTER_KEY)
            .unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&COUNTER_KEY, &counter);

        let token_id = counter;

        // Crear certificado
        let certificate = CertificateData {
            owner: to.clone(),
            lesson_id: lesson_id.clone(),
            module_id,
            username,
            score,
            xp_earned,
            issued_at: env.ledger().timestamp(),
            metadata_uri,
            token_id,
        };

        // Guardar certificado
        env.storage().persistent().set(&DataKey::Certificate(token_id), &certificate);

        // Actualizar lista de certificados del usuario
        let mut user_certs: Vec<u64> = env.storage().persistent()
            .get(&DataKey::UserCertificates(to.clone()))
            .unwrap_or(Vec::new(&env));
        user_certs.push_back(token_id);
        env.storage().persistent().set(&DataKey::UserCertificates(to.clone()), &user_certs);

        // Emitir evento
        env.events().publish(
            (Symbol::new(&env, "mint"), to),
            (token_id, lesson_id, score),
        );

        log!(&env, "NFT Certificate minted. Token ID: {}, Score: {}", token_id, score);

        token_id
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    /// Obtiene los datos de un certificado por su token_id
    pub fn get_certificate(env: Env, token_id: u64) -> Option<CertificateData> {
        env.storage().persistent().get(&DataKey::Certificate(token_id))
    }

    /// Lista todos los token_ids de certificados de un usuario
    pub fn get_user_certificates(env: Env, owner: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::UserCertificates(owner))
            .unwrap_or(Vec::new(&env))
    }

    /// Total de NFTs emitidos en el contrato
    pub fn total_supply(env: Env) -> u64 {
        env.storage().instance().get(&COUNTER_KEY).unwrap_or(0)
    }

    /// Verifica si un usuario completó una lección específica (tiene el NFT)
    pub fn has_certificate(env: Env, owner: Address, lesson_id: String) -> bool {
        let user_certs: Vec<u64> = env.storage().persistent()
            .get(&DataKey::UserCertificates(owner.clone()))
            .unwrap_or(Vec::new(&env));

        for token_id in user_certs.iter() {
            if let Some(cert) = env.storage().persistent()
                .get::<DataKey, CertificateData>(&DataKey::Certificate(token_id))
            {
                if cert.lesson_id == lesson_id {
                    return true;
                }
            }
        }
        false
    }

    /// Obtiene el admin actual del contrato
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN_KEY)
            .expect("Contract not initialized")
    }

    /// Transfiere la administración a otra dirección
    pub fn transfer_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();
        env.storage().instance().set(&ADMIN_KEY, &new_admin);
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Ledger}, Env, Address, String};

    fn create_test_env() -> (Env, NftCertificateContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, NftCertificateContract);
        let client = NftCertificateContractClient::new(&env, &contract_id);
        (env, client)
    }

    #[test]
    fn test_initialize() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        client.initialize(&admin);
        assert_eq!(client.admin(), admin);
        assert_eq!(client.total_supply(), 0);
    }

    #[test]
    fn test_mint_certificate() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);

        let token_id = client.mint(
            &user,
            &String::from_str(&env, "intro-blockchain-01"),
            &String::from_str(&env, "intro-blockchain"),
            &String::from_str(&env, "maria123"),
            &85,
            &50,
            &String::from_str(&env, "ipfs://QmTonalliCert001"),
        );

        assert_eq!(token_id, 1);
        assert_eq!(client.total_supply(), 1);

        let cert = client.get_certificate(&token_id).unwrap();
        assert_eq!(cert.owner, user);
        assert_eq!(cert.score, 85);
        assert_eq!(cert.xp_earned, 50);
    }

    #[test]
    fn test_get_user_certificates() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);

        // Mint 2 certificados para el mismo usuario
        client.mint(
            &user,
            &String::from_str(&env, "lesson-01"),
            &String::from_str(&env, "module-01"),
            &String::from_str(&env, "test_user"),
            &90, &50,
            &String::from_str(&env, "ipfs://cert1"),
        );
        client.mint(
            &user,
            &String::from_str(&env, "lesson-02"),
            &String::from_str(&env, "module-01"),
            &String::from_str(&env, "test_user"),
            &75, &50,
            &String::from_str(&env, "ipfs://cert2"),
        );

        let certs = client.get_user_certificates(&user);
        assert_eq!(certs.len(), 2);
    }

    #[test]
    fn test_has_certificate() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);

        assert!(!client.has_certificate(&user, &String::from_str(&env, "lesson-01")));

        client.mint(
            &user,
            &String::from_str(&env, "lesson-01"),
            &String::from_str(&env, "module-01"),
            &String::from_str(&env, "test_user"),
            &80, &50,
            &String::from_str(&env, "ipfs://cert1"),
        );

        assert!(client.has_certificate(&user, &String::from_str(&env, "lesson-01")));
        assert!(!client.has_certificate(&user, &String::from_str(&env, "lesson-02")));
    }

    #[test]
    #[should_panic(expected = "Contract already initialized")]
    fn test_double_initialize_fails() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        client.initialize(&admin);
        client.initialize(&admin); // debe fallar
    }

    #[test]
    #[should_panic(expected = "Score must be between 0 and 100")]
    fn test_invalid_score_fails() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        client.initialize(&admin);
        client.mint(
            &user,
            &String::from_str(&env, "lesson-01"),
            &String::from_str(&env, "module-01"),
            &String::from_str(&env, "user"),
            &101, // inválido
            &50,
            &String::from_str(&env, "ipfs://x"),
        );
    }

    #[test]
    fn test_transfer_admin() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);
        client.initialize(&admin);
        assert_eq!(client.admin(), admin);
        client.transfer_admin(&new_admin);
        assert_eq!(client.admin(), new_admin);
    }

    #[test]
    fn test_get_certificate_nonexistent() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        client.initialize(&admin);
        let cert = client.get_certificate(&999);
        assert!(cert.is_none());
    }

    #[test]
    fn test_get_user_certificates_empty() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        client.initialize(&admin);
        let certs = client.get_user_certificates(&user);
        assert_eq!(certs.len(), 0);
    }

    #[test]
    fn test_multiple_users() {
        let (env, client) = create_test_env();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        client.initialize(&admin);

        client.mint(
            &user1,
            &String::from_str(&env, "lesson-01"),
            &String::from_str(&env, "module-01"),
            &String::from_str(&env, "user1"),
            &90, &50,
            &String::from_str(&env, "ipfs://cert1"),
        );
        client.mint(
            &user2,
            &String::from_str(&env, "lesson-01"),
            &String::from_str(&env, "module-01"),
            &String::from_str(&env, "user2"),
            &85, &50,
            &String::from_str(&env, "ipfs://cert2"),
        );

        assert_eq!(client.total_supply(), 2);
        assert_eq!(client.get_user_certificates(&user1).len(), 1);
        assert_eq!(client.get_user_certificates(&user2).len(), 1);
    }
}
