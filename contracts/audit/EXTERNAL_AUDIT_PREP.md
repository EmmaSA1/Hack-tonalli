# External Security Audit — Preparation & Status
**Issue:** #20 [M4-001] External Smart Contract Security Audit
**Date:** 2026-04-28
**Contracts in scope:** `nft-certificate`, `learn-to-earn`
**Status:** 🔴 NOT READY — Prerequisites incomplete

---

## Prerequisites Checklist

| Requirement | Status | Notes |
|---|---|---|
| M1-001: Unit tests with 90% coverage | ❌ Incomplete | Current backend coverage is ~0.7% |
| M1-002: Integration tests with 90% coverage | ❌ Incomplete | No integration tests written yet |
| M1-004: Internal security audit complete | ✅ Complete | See `contracts/SECURITY_AUDIT_INTERNAL.md` |
| Code freeze (2 weeks before submission) | ❌ Pending | Cannot start until M1-001 and M1-002 are done |
| All internal findings resolved | ❌ Pending | 8 open findings from internal audit |

---

## Internal Audit Findings to Resolve Before External Audit

The following findings from `SECURITY_AUDIT_INTERNAL.md` must be fixed before sending to an external firm:

| Finding | Contract | Severity | Status |
|---|---|---|---|
| [L2E-01] Token transfer before state update | learn-to-earn | 🔴 Medium | Open |
| [L2E-02] Unchecked arithmetic in bonus | learn-to-earn | 🟡 Low | Open |
| [L2E-03] Unbounded reward history | learn-to-earn | 🟡 Low | Open |
| [CERT-01] Unbounded UserCertificates Vec | nft-certificate | 🟡 Low | Open |
| [L2E-04] No upgrade path | learn-to-earn | 🔴 High | Open |
| [CERT-02] No upgrade path | nft-certificate | 🔴 High | Open |

---

## Recommended Audit Firms

### 1. OtterSec
- **Website:** https://osec.io
- **Speciality:** Solana and Rust-based smart contracts. Strong Soroban experience.
- **Contact:** hello@osec.io
- **Estimated timeline:** 2–3 weeks

### 2. Trail of Bits
- **Website:** https://www.trailofbits.com
- **Speciality:** Deep Rust expertise, formal verification, broad blockchain coverage.
- **Contact:** https://www.trailofbits.com/contact
- **Estimated timeline:** 3–4 weeks

### 3. Cantina
- **Website:** https://cantina.xyz
- **Speciality:** Competitive audit marketplace, good for Rust/Soroban contracts.
- **Contact:** https://cantina.xyz/contact
- **Estimated timeline:** 2–4 weeks

---

## Audit Scope

### Contracts to audit
- `Services-Tonalli/contracts/learn-to-earn/src/lib.rs`
- `Services-Tonalli/contracts/nft-certificate/src/lib.rs`

### Out of scope
- `podio-nft` — lower risk, no direct token transfers
- `tonalli-token` — based on standard SEP-41 implementation
- Backend (NestJS) and frontend (React) code

### Key areas for auditors to focus on
1. XLM transfer logic and reentrancy in `learn-to-earn`
2. Token counter integrity and double-mint prevention in `nft-certificate`
3. Access control and admin key management
4. Storage exhaustion attack vectors
5. Upgrade path security

---

## Estimated Timeline (once prerequisites are met)

| Phase | Duration |
|---|---|
| Complete M1-001 and M1-002 (90% coverage) | 2–3 weeks |
| Resolve all internal audit findings | 1 week |
| Code freeze | 2 weeks |
| External audit | 2–4 weeks |
| Fix audit findings | 1–2 weeks |
| Audit firm verifies fixes | 1 week |
| **Total estimated time to mainnet ready** | **9–13 weeks** |

---

## Next Steps

1. Complete issues M1-001 and M1-002 (test coverage to 90%)
2. Fix all open findings from the internal audit (`SECURITY_AUDIT_INTERNAL.md`)
3. Initiate contact with at least two audit firms to get quotes and timeline estimates
4. Schedule code freeze once a firm is selected
5. Submit contracts for external audit
6. Document and verify all fixes from the audit report

---

*This document will be updated as prerequisites are completed.*
