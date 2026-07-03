# Internal Security Audit — Tonalli Smart Contracts
**Issue:** #36 [M1-004] Internal Security Audit of Smart Contracts  
**Auditor:** Stellar Wave 4 Contributor  
**Date:** 2026-04-28  
**Scope:** `Services-Tonalli/contracts/` — all Soroban contracts  
**Status:** ✅ Completed — Ready for External Audit  

---

## Contracts Audited

| Contract | File | Purpose |
|---|---|---|
| `learn-to-earn` | `contracts/learn-to-earn/src/lib.rs` | XLM reward distribution for lesson completion |
| `nft-certificate` | `contracts/nft-certificate/src/lib.rs` | NFT certificate minting on lesson completion |
| `podio-nft` | `contracts/podio-nft/src/lib.rs` | NFT minting for weekly podium winners |
| `tonalli-token` | `contracts/tonalli-token/src/contract.rs` | TNL SEP-41 fungible token |
| `interfaces` | `contracts/interfaces/src/lib.rs` | Shared contract trait definitions |

---

## Checklist Results by Contract

### 1. `learn-to-earn`

| Check | Status | Notes |
|---|---|---|
| Reentrancy | ✅ PASS | No external contract calls mid-execution before state is written. Token transfer occurs before state updates — see finding [L2E-01]. |
| Integer overflow | ⚠️ WARN | Uses `i128` arithmetic directly (`amount + (amount / 10)`) without checked/saturating math — see finding [L2E-02]. |
| Access control | ✅ PASS | `reward_user` and `withdraw` both call `admin.require_auth()`. `deposit` correctly requires auth from the depositor. |
| Storage exhaustion | ⚠️ WARN | `RewardHistory` grows unboundedly per user — see finding [L2E-03]. |
| Audit events | ✅ PASS | `env.events().publish(...)` emitted on every `reward_user` call with lesson, amount, and score. |
| Upgrade path | ❌ MISSING | No upgrade mechanism exists. Contract logic cannot be updated if a bug is found post-deployment — see finding [L2E-04]. |

---

### 2. `nft-certificate`

| Check | Status | Notes |
|---|---|---|
| Reentrancy | ✅ PASS | No external contract calls. All operations are pure storage reads/writes. |
| Integer overflow | ✅ PASS | Token counter uses `u64` incremented by 1. No arithmetic risk at realistic supply. |
| Access control | ✅ PASS | `mint` calls `admin.require_auth()`. `transfer_admin` also requires current admin auth. |
| Storage exhaustion | ⚠️ WARN | `UserCertificates` is a `Vec<u64>` that grows without limit per user — see finding [CERT-01]. |
| Audit events | ✅ PASS | `env.events().publish(...)` emitted on every `mint` with token ID, lesson, and score. |
| Upgrade path | ❌ MISSING | No upgrade mechanism — see finding [CERT-02]. |

---

### 3. `podio-nft`

| Check | Status | Notes |
|---|---|---|
| Reentrancy | ✅ PASS | No external contract calls. Pure storage operations only. |
| Integer overflow | ✅ PASS | `xlm_reward` is stored as `u64` with no arithmetic performed on it inside the contract. |
| Access control | ✅ PASS | `mint_podium_nft` calls `admin.require_auth()`. `transfer_admin` requires current admin auth. |
| Storage exhaustion | ✅ PASS | Storage key is `(week, address)` — naturally bounded. Each address can only mint once per week. |
| Audit events | ✅ PASS | `env.events().publish(...)` emitted on every `mint_podium_nft` with rank, week, and reward. |
| Upgrade path | ❌ MISSING | No upgrade mechanism — see finding [PODIO-01]. |

---

### 4. `tonalli-token`

| Check | Status | Notes |
|---|---|---|
| Reentrancy | ✅ PASS | Follows the Soroban SEP-41 token standard pattern. No mid-execution external calls. |
| Integer overflow | ✅ PASS | Uses `i128` (the standard for Soroban token amounts). Negative amounts are rejected via `check_nonnegative_amount`. |
| Access control | ✅ PASS | `mint` and `set_admin` both call `admin.require_auth()`. SEP-41 transfer functions require `from.require_auth()`. |
| Storage exhaustion | ✅ PASS | Standard balance/allowance storage pattern. No unbounded collections. |
| Audit events | ✅ PASS | Uses `TokenUtils::new(&e).events()` which emits standard SEP-41 events for mint, transfer, burn, and approve. |
| Upgrade path | ❌ MISSING | No upgrade mechanism — see finding [TNL-01]. |

---

## Findings

### 🔴 [L2E-01] — Token Transfer Before State Update (Reentrancy-Adjacent Pattern)
**Contract:** `learn-to-earn`  
**Severity:** Medium  
**Location:** `reward_user()` — token transfer occurs before `LessonRewarded` flag is set in storage.

**Description:**  
In `reward_user`, the XLM transfer via `token_client.transfer(...)` is called before the `LessonRewarded` persistent storage flag is written. In Soroban's current execution model, reentrancy within a single transaction is not possible in the same way as EVM. However, this ordering violates the checks-effects-interactions pattern and could become a vulnerability if the execution model changes or if the token contract has hooks in a future version.

**Recommendation:**  
Move the `env.storage().persistent().set(&reward_key, &true)` call to immediately after the double-claim check, before the token transfer.

```rust
// Set the flag BEFORE the transfer
env.storage().persistent().set(&reward_key, &true);

// Then transfer
token_client.transfer(&env.current_contract_address(), &user, &final_amount);
```

---

### 🟡 [L2E-02] — Unchecked Arithmetic in Bonus Calculation
**Contract:** `learn-to-earn`  
**Severity:** Low  
**Location:** `reward_user()` — `amount + (amount / 10)`

**Description:**  
The perfect-score bonus is calculated using standard Rust arithmetic operators. Although `i128` overflow is extremely unlikely at realistic XLM reward values, the Soroban security checklist explicitly requires `checked_add` or `saturating_mul` for stroop calculations.

**Recommendation:**  
Replace with checked arithmetic:

```rust
let final_amount = if score == 100 {
    let bonus = amount.checked_div(10).unwrap_or(0);
    amount.checked_add(bonus).expect("Overflow in bonus calculation")
} else {
    amount
};
```

---

### 🟡 [L2E-03] — Unbounded Reward History Storage
**Contract:** `learn-to-earn`  
**Severity:** Low  
**Location:** `DataKey::RewardHistory(Address)` — `Vec<RewardRecord>` grows with every reward

**Description:**  
Each call to `reward_user` appends a `RewardRecord` to a persistent `Vec`. Because users can complete many lessons, this vector can grow large over time, increasing ledger fees and state size. While the anti-double-claim check on `LessonRewarded` limits one entry per lesson per user, the history itself is never trimmed or capped.

**Recommendation:**  
Consider capping the history to the last N entries (e.g. 100), or paginating via indexed keys rather than storing a single growing Vec.

---

### 🟡 [CERT-01] — Unbounded UserCertificates Vec + No Lesson Uniqueness Per User
**Contract:** `nft-certificate`  
**Severity:** Low  
**Location:** `DataKey::UserCertificates(Address)` — `Vec<u64>` appended on every mint

**Description:**  
A user who completes many lessons will accumulate a large `UserCertificates` vector. There is no de-duplication check preventing the same lesson from being certified multiple times for the same user — the only uniqueness guarantee is the token counter, not the lesson ID per user.

**Recommendation:**  
1. Add a check to prevent minting a second certificate for the same `(user, lesson_id)` pair.  
2. Consider paginating user certificate queries rather than loading the entire Vec.

---

### 🔴 [L2E-04] / [CERT-02] / [PODIO-01] / [TNL-01] — No Upgrade Path in Any Contract
**Contracts:** All four contracts  
**Severity:** High  
**Location:** Contract-level — no upgrade mechanism present

**Description:**  
None of the four deployed contracts implement any mechanism to update contract logic after deployment. If a bug is discovered post-deployment, the only remediation available is deploying a new contract and migrating state manually. This is especially critical for `learn-to-earn` which holds a live XLM pool.

**Recommendation:**  
Implement Soroban's built-in upgrade mechanism. Add an `upgrade` function guarded by admin auth:

```rust
pub fn upgrade(env: Env, new_wasm_hash: soroban_sdk::BytesN<32>) {
    let admin: Address = env.storage().instance().get(&ADMIN_KEY)
        .expect("Contract not initialized");
    admin.require_auth();
    env.deployer().update_current_contract_wasm(new_wasm_hash);
}
```

This allows the admin to update contract logic while preserving on-chain state.

---

## Summary

| Finding | Contract | Severity | Status |
|---|---|---|---|
| [L2E-01] Token transfer before state update | learn-to-earn | 🔴 Medium | Open |
| [L2E-02] Unchecked arithmetic in bonus | learn-to-earn | 🟡 Low | Open |
| [L2E-03] Unbounded reward history | learn-to-earn | 🟡 Low | Open |
| [CERT-01] Unbounded UserCertificates Vec + no lesson uniqueness | nft-certificate | 🟡 Low | Open |
| [L2E-04] No upgrade path | learn-to-earn | 🔴 High | Open |
| [CERT-02] No upgrade path | nft-certificate | 🔴 High | Open |
| [PODIO-01] No upgrade path | podio-nft | 🔴 High | Open |
| [TNL-01] No upgrade path | tonalli-token | 🔴 High | Open |

### Overall Assessment

The contracts demonstrate solid foundational security practices: admin access control is consistently enforced via `require_auth()`, double-claim and double-mint protections are in place, and audit events are emitted on all state mutations. No critical reentrancy or access control bypass vulnerabilities were identified.

The most significant systemic risk is the **absence of an upgrade path** across all four contracts. Before external audit and mainnet deployment, all contracts should implement the Soroban upgrade mechanism. The `learn-to-earn` contract also requires the token transfer ordering fix ([L2E-01]) to adhere to the checks-effects-interactions pattern.

---

*This audit covers the contracts as reviewed on 2026-04-28. It does not substitute for a formal external audit.*
