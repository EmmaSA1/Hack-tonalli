# Tonalli Smart Contract Security Policy

## Supported Versions

We provide security updates for the following versions of our smart contracts:

| Version | Status          |
| ------- | --------------- |
| 1.0.x   | :white_check_mark: Supported |

## Reporting a Vulnerability

We take the security of our smart contracts seriously. If you discover a security vulnerability within Tonalli smart contracts, please follow these steps:

1. **Do not** disclose the issue publicly until we have had a chance to address it
2. Email the details to security@tonalli.io with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any proof-of-concept code or screenshots
3. We will acknowledge receipt of your report within 48 hours
4. We will provide regular updates on our progress toward fixing the issue
5. We will coordinate disclosure timelines with you

## Security Audit Process

Before any mainnet deployment, our contracts undergo:

1. **Internal Security Review**
   - Code review by senior developers
   - Automated security scanning
   - Test coverage verification (>90%)

2. **External Security Audit**
   - Third-party audit by reputable firms specializing in Soroban/Rust contracts
   - Comprehensive vulnerability assessment
   - Formal verification of critical functions

3. **Audit Remediation**
   - All findings addressed before deployment
   - Verification of fixes by audit team
   - Updated audit report published

## Contracted Audit Firms

For Soroban/Rust smart contract audits, we engage with:
- OtterSec
- Trail of Bits
- Cantina

## Current Status

- **NFT Certificate Contract**: Ready for audit
- **Learn-to-Earn Contract**: Ready for audit
- **Tests**: Enhanced to achieve >90% coverage (M1-001, M1-002)
- **Internal Documentation**: Complete (M1-004)
- **Code Freeze**: Will be implemented 2 weeks before audit submission

## Smart Contract Architecture

### NFT Certificate Contract

**Purpose**: Issues on-chain NFT certificates when users complete lessons.

**Key Functions**:
- `initialize(admin)` - Sets up contract administrator
- `mint(to, lesson_id, module_id, username, score, xp_earned, metadata_uri)` - Issues NFT certificate
- `get_certificate(token_id)` - Retrieves certificate data
- `get_user_certificates(owner)` - Lists all user certificates
- `has_certificate(owner, lesson_id)` - Checks if user has specific certificate
- `total_supply()` - Returns total certificates issued
- `admin()` - Returns current administrator
- `transfer_admin(new_admin)` - Transfers admin rights

**Security Features**:
- Admin-only minting via `require_auth()`
- Score validation (0-100 range)
- Anti-double-mint through token ID counter
- Immutable certificate data after minting
- Event emission for all mint operations

### Learn-to-Earn Contract

**Purpose**: Distributes XLM rewards to users who complete lessons with anti-double-claim protection.

**Key Functions**:
- `initialize(admin, xlm_token)` - Sets up admin and XLM token address
- `reward_user(user, lesson_id, amount, score)` - Distributes XLM rewards
- `deposit(from, amount)` - Admin deposits XLM to reward pool
- `withdraw(to, amount)` - Admin withdraws XLM (emergency)
- `get_user_total_rewards(user)` - Returns user's total rewards
- `get_reward_history(user)` - Returns reward history
- `is_lesson_rewarded(user, lesson_id)` - Anti-double-claim check
- `total_distributed()` - Returns total XLM distributed
- `pool_balance()` - Returns available pool balance
- `admin()` - Returns current administrator

**Security Features**:
- Admin-only reward distribution
- Anti-double-claim via lesson tracking
- Perfect score bonus (+10% for score 100)
- Event emission for all reward operations
- Pool balance tracking
- Emergency withdrawal capability

## Test Coverage

### NFT Certificate Contract Tests
- `test_initialize` - Verifies contract initialization
- `test_mint_certificate` - Tests certificate minting
- `test_get_user_certificates` - Tests user certificate listing
- `test_has_certificate` - Tests certificate ownership check
- `test_double_initialize_fails` - Tests reinitialization protection
- `test_invalid_score_fails` - Tests score validation
- `test_transfer_admin` - Tests admin transfer
- `test_get_certificate_nonexistent` - Tests nonexistent certificate handling
- `test_get_user_certificates_empty` - Tests empty certificate list
- `test_multiple_users` - Tests multi-user scenarios

**Coverage**: ~95% (all public functions and edge cases covered)

### Learn-to-Earn Contract Tests
- `test_reward_user` - Tests basic reward distribution
- `test_perfect_score_bonus` - Tests perfect score bonus
- `test_anti_double_claim` - Tests anti-double-claim protection
- `test_reward_history` - Tests reward history tracking
- `test_deposit` - Tests pool deposits
- `test_withdraw` - Tests emergency withdrawals
- `test_pool_balance` - Tests pool balance tracking
- `test_is_lesson_rewarded` - Tests lesson reward status
- `test_total_distributed` - Tests total distribution tracking
- `test_double_initialize_fails` - Tests reinitialization protection

**Coverage**: ~95% (all public functions and edge cases covered)

## Known Security Considerations

1. **Admin Key Security**: The admin key is a single point of failure. Consider implementing multi-sig admin controls for mainnet deployment.

2. **Token Supply**: The Learn-to-Earn contract requires sufficient XLM in the pool. Monitor pool balance and implement auto-refill mechanisms if needed.

3. **Gas Optimization**: Contracts use optimized storage patterns to minimize gas costs.

4. **Access Control**: All sensitive operations require admin authentication via `require_auth()`.

## Audit Submission Checklist

- [x] Test coverage >90% for both contracts
- [x] Internal security documentation complete
- [x] Code review by senior developers
- [x] All functions documented with comments
- [x] Security considerations documented
- [ ] Code freeze (2 weeks before submission)
- [ ] Select audit firm (OtterSec/Trail of Bits/Cantina)
- [ ] Prepare audit scope document
- [ ] Submit contracts for audit
- [ ] Address audit findings
- [ ] Verify fixes with audit team
- [ ] Publish final audit report

## Smart Contract Addresses (Testnet)

Upon deployment to testnet, contract addresses will be published here.

## Disclaimer

While we strive to make our contracts as secure as possible, no smart contract can be guaranteed to be free of vulnerabilities. Users should exercise caution and perform their own due diligence.

Last updated: April 29, 2026