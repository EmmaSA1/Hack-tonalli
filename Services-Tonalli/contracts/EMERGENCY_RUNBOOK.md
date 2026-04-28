# Emergency Runbook (Soroban Contracts)

This runbook defines the response process for production incidents in `nft-certificate` and `learn-to-earn`.

## Scope

- Contract upgrades use `upgrade(approvers, new_wasm_hash)` with **2-of-3** upgrade admin signatures.
- `learn-to-earn` includes:
  - `pause()` / `unpause()` to stop/resume reward distribution.
  - `emergency_withdraw(admin, to, amount)` to rescue pool funds.

## Roles

- **Primary admin**: operational owner, can pause/unpause and execute emergency withdraw.
- **Guardian 2 and Guardian 3**: co-signers for upgrades.
- **Incident commander**: coordinates timeline, approvals, and postmortem.

## Severity Levels

- **SEV-1**: active exploit or unauthorized reward drain.
- **SEV-2**: high-risk bug with no confirmed exploitation.
- **SEV-3**: degraded behavior without fund risk.

## Immediate Response

1. Declare incident and open incident channel.
2. Freeze reward outflow:
   - Call `pause()` on `learn-to-earn`.
3. Validate current contract and pool state:
   - `is_paused()`
   - `pool_balance()`
   - recent `reward` events
4. If funds are at risk, execute rescue:
   - `emergency_withdraw(admin, cold_wallet, amount)`
5. Preserve evidence:
   - transaction hashes
   - ledger sequence/time window
   - affected addresses and lesson IDs

## Upgrade Procedure (2-of-3)

1. Build and audit patched WASM.
2. Compute and verify `new_wasm_hash`.
3. Prepare `approvers` with any 2 unique addresses from:
   - primary admin
   - guardian 2
   - guardian 3
4. Submit `upgrade(approvers, new_wasm_hash)` including both auth signatures.
5. Verify post-upgrade:
   - read-only queries return expected values
   - storage/state preserved
   - no unauthorized behavior

## Recovery and Resume

1. If `learn-to-earn` was paused, keep paused until:
   - fix verified on testnet/staging
   - upgrade completed
   - monitoring checks green
2. Call `unpause()`.
3. Execute canary rewards with low amounts.
4. Resume normal operations.

## Communication Checklist

- Notify stakeholders at incident start, mitigation, and resolution.
- Publish user-facing update if funds or rewards are impacted.
- Share final postmortem with:
  - root cause
  - blast radius
  - timeline
  - preventive actions

## Minimum Tooling

- Keep guardian keys in separate secure custody.
- Require transaction review before any `upgrade`.
- Maintain tested scripts for:
  - pause
  - emergency withdraw
  - upgrade with multi-signature approvals
