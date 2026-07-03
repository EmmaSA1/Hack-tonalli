# Tonalli Smart Contracts - Internal Security Audit

**Date:** April 28, 2026  
**Auditor:** Internal Security Review  
**Scope:** tonalli-token, learn-to-earn, nft-certificate, podium-nft

---

## Executive Summary

This document contains the internal security audit results for all Soroban smart contracts in the Tonalli project. Each contract was reviewed against common Soroban vulnerabilities including reentrancy, integer overflow, access control, storage exhaustion, event logging, and upgrade paths.

**Overall Assessment:** All contracts implement adequate security controls. Minor recommendations are provided below.

---

## Audit Checklist Results

| Checkpoint | learn-to-earn | nft-certificate | podium-nft | tonalli-token |
|------------|---------------|-----------------|------------|---------------|
| Reentrancy Protection | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Integer Overflow | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Access Control | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Storage Exhaustion | ⚠️ REVIEW | ✅ PASS | ✅ PASS | ✅ PASS |
| Events Emitted | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Upgrade Path | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING |

---

## Contract-by-Contract Analysis

### 1. Learn-to-Earn Contract (`learn-to-earn`)

**Location:** `contracts/learn-to-earn/src/lib.rs`

#### Reentrancy: ✅ PASS
- The contract makes one external call to the XLM token contract (`token_client.transfer()`)
- This call occurs AFTER all state changes (anti-double-claim storage update happens before transfer)
- No callback mechanism exists; Soroban's Rust environment prevents reentrancy by default

#### Integer Overflow: ✅ PASS
- Uses native Rust i128 for stroop calculations
- Bonus calculation uses simple division: `amount + (amount / 10)`
- Rust's checked arithmetic recommended for future-proofing but current implementation is safe for stroop values

#### Access Control: ✅ PASS
- `reward_user()`: `admin.require_auth()` - only admin can call
- `deposit()`: `from.require_auth()` - any user can deposit (by design)
- `withdraw()`: `admin.require_auth()` - only admin can withdraw
- `initialize()`: uses has() check to prevent re-initialization

#### Storage Exhaustion: ⚠️ REVIEW
- Uses `persistent()` storage for user-specific data
- Each reward creates entries: `UserRewards`, `LessonRewarded`, `RewardHistory`
- **Risk:** Malicious admin could spam rewards to fill storage
- **Mitigation:** Requires admin authentication; consider rate limiting at backend level
- **Recommendation:** Add maximum reward limit per user or total supply cap

#### Events Emitted: ✅ PASS
- Emits custom event on every reward: `env.events().publish((Symbol::new(&env, "reward"), user), (lesson_id, final_amount, score));`
- All state mutations include event emission

#### Upgrade Path: ❌ MISSING
- No upgrade mechanism implemented
- **Recommendation:** Implement WASM module upgrade capability or plan for migration strategy

---

### 2. NFT Certificate Contract (`nft-certificate`)

**Location:** `contracts/nft-certificate/src/lib.rs`

#### Reentrancy: ✅ PASS
- No external contract calls during mint
- All storage operations complete before function returns

#### Integer Overflow: ✅ PASS
- Counter uses u64, increment is safe
- Score validation: `if score > 100` - explicit bounds check

#### Access Control: ✅ PASS
- `mint()`: `admin.require_auth()` - only admin can mint
- `transfer_admin()`: `admin.require_auth()` - only current admin can transfer
- `initialize()`: prevents re-initialization with has() check

#### Storage Exhaustion: ✅ PASS
- Certificate storage keyed by unique token_id
- User certificates stored as Vec<u64> - bounded by total supply
- No user-controlled storage keys that could cause exhaustion

#### Events Emitted: ✅ PASS
- Emits event on mint: `env.events().publish((Symbol::new(&env, "mint"), to), (token_id, lesson_id, score));`

#### Upgrade Path: ❌ MISSING
- No upgrade mechanism
- **Recommendation:** Plan for migration if contract logic needs updating

---

### 3. Podium NFT Contract (`podio-nft`)

**Location:** `contracts/podio-nft/src/lib.rs`

#### Reentrancy: ✅ PASS
- No external contract calls
- Storage operations complete synchronously

#### Integer Overflow: ✅ PASS
- `rank`: u32 with explicit bounds check `if rank < 1 || rank > 3`
- `xlm_reward`: u64 - safe for stroop values
- `issued_at`: u64 ledger timestamp - safe

#### Access Control: ✅ PASS
- `mint_podium_nft()`: `admin.require_auth()`
- `transfer_admin()`: `admin.require_auth()`
- `initialize()`: prevents re-initialization

#### Storage Exhaustion: ✅ PASS
- Storage keyed by (week, address) tuple - bounded by number of winners
- Week format validation could be added but not critical

#### Events Emitted: ✅ PASS
- Emits event on mint: `env.events().publish((Symbol::new(&env, "mint_podium"), address), (rank, week, xlm_reward));`

#### Upgrade Path: ❌ MISSING
- No upgrade mechanism

---

### 4. TNL Token Contract (`tonalli-token`)

**Location:** `contracts/tonalli-token/src/`

**Note:** This contract is a SEP-41 token implementation using `soroban_token_sdk`. Security is largely handled by the SDK.

#### Reentrancy: ✅ PASS
- Token transfers use standard SDK patterns
- State updates happen atomically

#### Integer Overflow: ✅ PASS
- SDK handles stroop calculations safely
- Non-negative amount check: `check_nonnegative_amount(amount)`

#### Access Control: ✅ PASS
- `mint()`: requires admin auth via `admin.require_auth()`
- `set_admin()`: requires admin auth
- `initialize()`: no re-initialization possible after first call

#### Storage Exhaustion: ✅ PASS
- Standard token storage patterns
- TTL extensions prevent data loss

#### Events Emitted: ✅ PASS
- Uses `TokenUtils::new(&e).events()` for standard token events (mint, burn, transfer, approve)

#### Upgrade Path: ❌ MISSING
- Standard token upgrade considerations apply

---

## Recommendations Summary

### High Priority
1. **Upgrade Path:** None of the contracts have an upgrade mechanism. Plan a migration strategy for each contract.

### Medium Priority
1. **Storage Exhaustion (learn-to-earn):** Add rate limiting or maximum reward caps to prevent potential storage exhaustion by malicious admin.

### Low Priority
1. **Integer Overflow:** Consider using explicit checked arithmetic (e.g., `checked_add`, `saturating_mul`) for bonus calculations in learn-to-earn.

---

## Testing Coverage

All contracts include comprehensive unit tests covering:
- Basic functionality
- Access control enforcement
- Anti-double-claim mechanisms
- Edge cases (invalid inputs, duplicate operations)

Run tests with:
```bash
cd Services-Tonalli/contracts
cargo test
```

---

## External Audit Recommendation

The contracts are ready for external audit with the following considerations:
1. Upgrade path should be addressed before mainnet deployment
2. Consider formal verification for the learn-to-earn reward calculation logic
3. Review backend integration points for reentrancy from contract callbacks

---

**End of Audit Report**