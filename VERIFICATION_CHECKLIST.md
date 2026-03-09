# Snowtrace Verification Execution Checklist

**Start Date:** ___________
**Completed Date:** ___________
**Verified By:** ___________

---

## Pre-Verification Setup

### Prerequisites
- [ ] Snowtrace API key obtained from https://testnet.snowtrace.io/myapikey
- [ ] Foundry installed: `forge --version` shows v0.2.x or higher
- [ ] Contracts compiled: `cd CAUSAL/contracts && forge build` succeeds
- [ ] Network: Connected to Fuji testnet (Chain ID 43113)
- [ ] All contract source files present in `contracts/src/`

### Environment Setup
- [ ] API key saved: `export SNOWTRACE_API_KEY="your_key_here"`
- [ ] Working directory: `cd CAUSAL/contracts`
- [ ] Foundry.toml verified:
  - [ ] `solc_version = "0.8.19"`
  - [ ] `evm_version = "paris"`
  - [ ] `optimizer = true`
  - [ ] `optimizer_runs = 200`
  - [ ] `via_ir = true`

---

## Contract 1: CausalOrganizations

### Verification
- [ ] Address: `0xeD8bB8758d7231771279F4d24905E46B8febbAa1`
- [ ] Source file exists: `src/CausalOrganizations.sol` ✓
- [ ] File compiles without errors ✓
- [ ] No constructor arguments (zero-args contract) ✓

### Verification Command
```bash
forge verify-contract \
  0xeD8bB8758d7231771279F4d24905E46B8febbAa1 \
  src/CausalOrganizations.sol:CausalOrganizations \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris
```

### Execution
- [ ] Command executed successfully
- [ ] Output shows: "Waiting for verification result..."
- [ ] Final output: "Contract verified successfully" ✓

### Post-Verification
- [ ] Check Snowtrace: https://testnet.snowtrace.io/address/0xeD8bB8758d7231771279F4d24905E46B8febbAa1#code
- [ ] Green checkmark appears next to contract name
- [ ] Source code readable on Snowtrace
- [ ] ABI section shows all functions
- [ ] Compiler version shows as 0.8.19

**Status:** ☐ Pending | ☑ Verified | ☐ Failed
**Notes:** _________________________________

---

## Contract 2: TreasuryFactory

### Verification
- [ ] Address: `0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134`
- [ ] Source file exists: `src/TreasuryFactory.sol` ✓
- [ ] File compiles without errors ✓
- [ ] No constructor arguments (zero-args contract) ✓

### Verification Command
```bash
forge verify-contract \
  0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134 \
  src/TreasuryFactory.sol:TreasuryFactory \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris
```

### Execution
- [ ] Command executed successfully
- [ ] Output shows: "Waiting for verification result..."
- [ ] Final output: "Contract verified successfully" ✓

### Post-Verification
- [ ] Check Snowtrace: https://testnet.snowtrace.io/address/0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134#code
- [ ] Green checkmark appears next to contract name
- [ ] Source code readable on Snowtrace
- [ ] ABI section shows all functions
- [ ] Compiler version shows as 0.8.19

**Status:** ☐ Pending | ☑ Verified | ☐ Failed
**Notes:** _________________________________

---

## Contract 3: ProposalFactoryDeployer

### Verification
- [ ] Address: `0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83`
- [ ] Source file exists: `src/ProposalFactoryDeployer.sol` ✓
- [ ] File compiles without errors ✓
- [ ] No constructor arguments (zero-args contract) ✓

### Verification Command
```bash
forge verify-contract \
  0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83 \
  src/ProposalFactoryDeployer.sol:ProposalFactoryDeployer \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris
```

### Execution
- [ ] Command executed successfully
- [ ] Output shows: "Waiting for verification result..."
- [ ] Final output: "Contract verified successfully" ✓

### Post-Verification
- [ ] Check Snowtrace: https://testnet.snowtrace.io/address/0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83#code
- [ ] Green checkmark appears next to contract name
- [ ] Source code readable on Snowtrace
- [ ] ABI section shows all functions
- [ ] Compiler version shows as 0.8.19

**Status:** ☐ Pending | ☑ Verified | ☐ Failed
**Notes:** _________________________________

---

## Contract 4: MockUSDC

### Verification
- [ ] Address: `0x096731dc6CA1FF91702394F8c5C31dD989608e7B`
- [ ] Source file exists: `src/MockUSDC.sol` ✓
- [ ] File compiles without errors ✓
- [ ] No constructor arguments (zero-args contract) ✓

### Verification Command
```bash
forge verify-contract \
  0x096731dc6CA1FF91702394F8c5C31dD989608e7B \
  src/MockUSDC.sol:MockUSDC \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris
```

### Execution
- [ ] Command executed successfully
- [ ] Output shows: "Waiting for verification result..."
- [ ] Final output: "Contract verified successfully" ✓

### Post-Verification
- [ ] Check Snowtrace: https://testnet.snowtrace.io/address/0x096731dc6CA1FF91702394F8c5C31dD989608e7B#code
- [ ] Green checkmark appears next to contract name
- [ ] Source code readable on Snowtrace
- [ ] ABI section shows all functions
- [ ] Compiler version shows as 0.8.19

**Status:** ☐ Pending | ☑ Verified | ☐ Failed
**Notes:** _________________________________

---

## Final Verification Summary

### All Contracts Status
| Contract | Address | Status | Date Verified |
|----------|---------|--------|---------------|
| CausalOrganizations | 0xeD8bB8758d7231771279F4d24905E46B8febbAa1 | ☐ ☑ | ___________ |
| TreasuryFactory | 0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134 | ☐ ☑ | ___________ |
| ProposalFactoryDeployer | 0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83 | ☐ ☑ | ___________ |
| MockUSDC | 0x096731dc6CA1FF91702394F8c5C31dD989608e7B | ☐ ☑ | ___________ |

### Overall Status
- [ ] All 4 contracts verified successfully
- [ ] All Snowtrace links show green checkmarks
- [ ] All source code readable on explorer
- [ ] Community notified of verified contracts

---

## Troubleshooting Log

**Issues Encountered:**
- [ ] None
- [ ] Issue 1: ________________________
- [ ] Issue 2: ________________________

**Issue 1 Resolution:**
```
Steps taken: ___________________________
Result: ___________________________
```

**Issue 2 Resolution:**
```
Steps taken: ___________________________
Result: ___________________________
```

---

## Sign-Off

**Verification Completed By:**
- Name: ___________________________
- Date: ___________________________
- Time Spent: ___________________________

**Verified On Snowtrace:**
- [ ] All 4 contracts shown with green checkmarks
- [ ] All source code readable
- [ ] All ABIs accessible

**Next Steps:**
- [ ] Document verification completion
- [ ] Share Snowtrace links on social media
- [ ] Begin external security audit
- [ ] Schedule mainnet deployment prep meeting

**Approval:**
- [ ] Lead Developer: _________ Date: _________
- [ ] Project Manager: _________ Date: _________

---

## Additional Notes

### What Verified Contracts Prove
Contract source code matches on-chain bytecode
Compiler settings are documented and reproducible
Code is transparent to auditors and users
No hidden malicious code in bytecode

### Benefits of Verification
- **Transparency:** Users can see exact contract code
- **Trust:** Proves contracts match deployed bytecode
- **Audit:** Source code available for security review
- **Support:** Snowtrace shows readable interface

### What's Next
1. **External Audit:** Share with audit firm
2. **Mainnet Prep:** Update phase durations
3. **Mainnet Deploy:** Deploy with same verification
4. **Community Launch:** Announce to users

---

**Verification Complete! 🎉**

All contracts verified on Snowtrace testnet. Ready for next phase.

