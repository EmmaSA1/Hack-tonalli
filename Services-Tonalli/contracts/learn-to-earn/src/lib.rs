//! # Tonalli Learn-to-Earn Contract (Soroban)
#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, log, symbol_short, token, Address, BytesN, Env, String,
    Symbol, Vec,
};

const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const TOKEN_KEY: Symbol = symbol_short!("TOKEN");
const TOTAL_KEY: Symbol = symbol_short!("TOTAL");
const PAUSED_KEY: Symbol = symbol_short!("PAUSED");
const UPGRADE_ADMINS_KEY: Symbol = symbol_short!("UP_ADM");
const UPGRADE_THRESHOLD: u32 = 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    UserRewards(Address),
    LessonRewarded(Address, String),
    RewardHistory(Address),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RewardRecord {
    pub lesson_id: String,
    pub amount: i128,
    pub timestamp: u64,
}

#[contract]
pub struct LearnToEarnContract;

#[contractimpl]
impl LearnToEarnContract {
    fn require_valid_upgrade_approvers(env: &Env, approvers: Vec<Address>) {
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&UPGRADE_ADMINS_KEY)
            .expect("Upgrade admins not configured");

        let mut approved_count: u32 = 0;
        let mut seen: Vec<Address> = Vec::new(env);

        for approver in approvers.iter() {
            let mut is_upgrade_admin = false;
            for admin in admins.iter() {
                if approver == admin {
                    is_upgrade_admin = true;
                    break;
                }
            }
            if !is_upgrade_admin {
                panic!("Approver is not an upgrade admin");
            }

            let mut already_seen = false;
            for prev in seen.iter() {
                if prev == approver {
                    already_seen = true;
                    break;
                }
            }

            if !already_seen {
                approver.require_auth();
                seen.push_back(approver);
                approved_count += 1;
            }
        }

        if approved_count < UPGRADE_THRESHOLD {
            panic!("Not enough upgrade admin approvals");
        }
    }

    fn require_not_paused(env: &Env) {
        let paused: bool = env.storage().instance().get(&PAUSED_KEY).unwrap_or(false);
        if paused {
            panic!("Contract is paused");
        }
    }

    pub fn initialize(
        env: Env,
        admin: Address,
        xlm_token: Address,
        upgrade_admin_2: Address,
        upgrade_admin_3: Address,
    ) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&TOKEN_KEY, &xlm_token);
        env.storage().instance().set(&TOTAL_KEY, &0i128);
        env.storage().instance().set(&PAUSED_KEY, &false);

        let mut upgrade_admins = Vec::new(&env);
        upgrade_admins.push_back(admin);
        upgrade_admins.push_back(upgrade_admin_2);
        upgrade_admins.push_back(upgrade_admin_3);
        env.storage().instance().set(&UPGRADE_ADMINS_KEY, &upgrade_admins);
        log!(&env, "Tonalli Learn-to-Earn Contract initialized");
    }

    pub fn reward_user(
        env: Env,
        user: Address,
        lesson_id: String,
        amount: i128,
        score: u32,
    ) -> i128 {
        Self::require_not_paused(&env);

        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();

        let reward_key = DataKey::LessonRewarded(user.clone(), lesson_id.clone());
        if env.storage().persistent().has(&reward_key) {
            panic!("User already rewarded for this lesson");
        }

        let final_amount = if score == 100 {
            amount + (amount / 10)
        } else {
            amount
        };

        let xlm_token: Address = env
            .storage()
            .instance()
            .get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &user, &final_amount);

        env.storage().persistent().set(&reward_key, &true);

        let user_key = DataKey::UserRewards(user.clone());
        let user_total: i128 = env.storage().persistent().get(&user_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&user_key, &(user_total + final_amount));

        let history_key = DataKey::RewardHistory(user.clone());
        let mut history: Vec<RewardRecord> = env
            .storage()
            .persistent()
            .get(&history_key)
            .unwrap_or(Vec::new(&env));
        history.push_back(RewardRecord {
            lesson_id: lesson_id.clone(),
            amount: final_amount,
            timestamp: env.ledger().timestamp(),
        });
        env.storage().persistent().set(&history_key, &history);

        let total: i128 = env.storage().instance().get(&TOTAL_KEY).unwrap_or(0);
        env.storage().instance().set(&TOTAL_KEY, &(total + final_amount));

        env.events().publish(
            (Symbol::new(&env, "reward"), user.clone()),
            (lesson_id, final_amount, score),
        );

        log!(&env, "Reward sent: {} stroops to {}", final_amount, user);
        final_amount
    }

    pub fn get_user_total_rewards(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::UserRewards(user))
            .unwrap_or(0)
    }

    pub fn get_reward_history(env: Env, user: Address) -> Vec<RewardRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::RewardHistory(user))
            .unwrap_or(Vec::new(&env))
    }

    pub fn is_lesson_rewarded(env: Env, user: Address, lesson_id: String) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::LessonRewarded(user, lesson_id))
    }

    pub fn total_distributed(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_KEY).unwrap_or(0)
    }

    pub fn pool_balance(env: Env) -> i128 {
        let xlm_token: Address = env
            .storage()
            .instance()
            .get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.balance(&env.current_contract_address())
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let xlm_token: Address = env
            .storage()
            .instance()
            .get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);
        log!(&env, "Pool deposit: {} stroops from {}", amount, from);
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();
        let xlm_token: Address = env
            .storage()
            .instance()
            .get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &to, &amount);
    }

    pub fn pause(env: Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();
        env.storage().instance().set(&PAUSED_KEY, &true);
    }

    pub fn unpause(env: Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .expect("Contract not initialized");
        admin.require_auth();
        env.storage().instance().set(&PAUSED_KEY, &false);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&PAUSED_KEY).unwrap_or(false)
    }

    pub fn emergency_withdraw(env: Env, admin: Address, to: Address, amount: i128) {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .expect("Contract not initialized");
        if admin != stored_admin {
            panic!("Invalid admin");
        }
        admin.require_auth();

        let xlm_token: Address = env
            .storage()
            .instance()
            .get(&TOKEN_KEY)
            .expect("Token not configured");
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &to, &amount);
    }

    pub fn upgrade(env: Env, approvers: Vec<Address>, new_wasm_hash: BytesN<32>) {
        Self::require_valid_upgrade_approvers(&env, approvers);
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    pub fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&ADMIN_KEY)
            .expect("Contract not initialized")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token::StellarAssetClient,
        Address, Env, String,
    };

    fn setup() -> (Env, Address, Address, Address, LearnToEarnContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let admin_2 = Address::generate(&env);
        let admin_3 = Address::generate(&env);
        let user = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_contract_id = env.register_stellar_asset_contract_v2(token_admin);
        let xlm_token = token_contract_id.address();

        let contract_id = env.register_contract(None, LearnToEarnContract);
        let client = LearnToEarnContractClient::new(&env, &contract_id);

        client.initialize(&admin, &xlm_token, &admin_2, &admin_3);

        let sac_client = StellarAssetClient::new(&env, &xlm_token);
        sac_client.mint(&contract_id, &100_000_000);

        (env, admin, user, xlm_token, client)
    }

    #[test]
    fn test_reward_user() {
        let (env, _admin, user, _xlm, client) = setup();
        let amount = client.reward_user(&user, &String::from_str(&env, "lesson-01"), &5_000_000, &80);
        assert_eq!(amount, 5_000_000);
        assert_eq!(client.get_user_total_rewards(&user), 5_000_000);
        assert_eq!(client.total_distributed(), 5_000_000);
    }

    #[test]
    fn test_perfect_score_bonus() {
        let (env, _admin, user, _xlm, client) = setup();
        let amount = client.reward_user(&user, &String::from_str(&env, "lesson-01"), &5_000_000, &100);
        assert_eq!(amount, 5_500_000);
    }

    #[test]
    #[should_panic(expected = "User already rewarded for this lesson")]
    fn test_anti_double_claim() {
        let (env, _admin, user, _xlm, client) = setup();
        client.reward_user(&user, &String::from_str(&env, "lesson-01"), &5_000_000, &80);
        client.reward_user(&user, &String::from_str(&env, "lesson-01"), &5_000_000, &80);
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
    #[should_panic(expected = "Contract is paused")]
    fn test_pause_blocks_rewards() {
        let (env, _admin, user, _xlm, client) = setup();
        client.pause();
        client.reward_user(&user, &String::from_str(&env, "lesson-01"), &1_000_000, &80);
    }

    #[test]
    fn test_unpause_allows_rewards_again() {
        let (env, _admin, user, _xlm, client) = setup();
        client.pause();
        client.unpause();
        let amount = client.reward_user(&user, &String::from_str(&env, "lesson-01"), &2_000_000, &80);
        assert_eq!(amount, 2_000_000);
    }
}
