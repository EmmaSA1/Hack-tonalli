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
- **Tests**: Being prepared to achieve >90% coverage
- **Internal Documentation**: This document
- **Code Freeze**: Will be implemented 2 weeks before audit submission

## Smart Contract Addresses (Testnet)

Upon deployment to testnet, contract addresses will be published here.

## Disclaimer

While we strive to make our contracts as secure as possible, no smart contract can be guaranteed to be free of vulnerabilities. Users should exercise caution and perform their own due diligence.

Last updated: April 28, 2026