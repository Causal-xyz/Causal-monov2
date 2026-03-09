# Contract Verification Status Tracker

**Last Updated:** 2026-03-06
**Network:** Avalanche Fuji Testnet (Chain ID: 43113)
**Status:** Ready for Verification

---

## Verification Checklist

### 1. CausalOrganizations
- **Address:** `0xeD8bB8758d7231771279F4d24905E46B8febbAa1`
- **Type:** Main contract (singleton)
- **Solidity:** 0.8.19
- **Source File:** `contracts/src/CausalOrganizations.sol`
- **Status:** ⏳ Ready to verify
- **Snowtrace Link:** https://testnet.snowtrace.io/address/0xeD8bB8758d7231771279F4d24905E46B8febbAa1
- **Verification Command:**
  ```bash
  forge verify-contract 0xeD8bB8758d7231771279F4d24905E46B8febbAa1 \
    src/CausalOrganizations.sol:CausalOrganizations \
    --rpc-url fuji \
    --verifier-url https://api-testnet.snowtrace.io/api \
    --etherscan-api-key $SNOWTRACE_API_KEY \
    --compiler-version v0.8.19 \
    --num-of-optimizations 200 \
    --evm-version paris
  ```
- **Notes:** Main contract managing all organizations, ICO campaigns, and proposal factories

---

### 2. TreasuryFactory
- **Address:** `0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134`
- **Type:** Helper contract (factory)
- **Solidity:** 0.8.19
- **Source File:** `contracts/src/TreasuryFactory.sol`
- **Status:** ⏳ Ready to verify
- **Snowtrace Link:** https://testnet.snowtrace.io/address/0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134
- **Verification Command:**
  ```bash
  forge verify-contract 0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134 \
    src/TreasuryFactory.sol:TreasuryFactory \
    --rpc-url fuji \
    --verifier-url https://api-testnet.snowtrace.io/api \
    --etherscan-api-key $SNOWTRACE_API_KEY \
    --compiler-version v0.8.19 \
    --num-of-optimizations 200 \
    --evm-version paris
  ```
- **Notes:** Deploys TreasuryV2 per organization to work around bytecode size limits

---

### 3. ProposalFactoryDeployer
- **Address:** `0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83`
- **Type:** Helper contract (factory)
- **Solidity:** 0.8.19
- **Source File:** `contracts/src/ProposalFactoryDeployer.sol`
- **Status:** ⏳ Ready to verify
- **Snowtrace Link:** https://testnet.snowtrace.io/address/0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83
- **Verification Command:**
  ```bash
  forge verify-contract 0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83 \
    src/ProposalFactoryDeployer.sol:ProposalFactoryDeployer \
    --rpc-url fuji \
    --verifier-url https://api-testnet.snowtrace.io/api \
    --etherscan-api-key $SNOWTRACE_API_KEY \
    --compiler-version v0.8.19 \
    --num-of-optimizations 200 \
    --evm-version paris
  ```
- **Notes:** Deploys ProposalFactoryV2 per organization to work around bytecode size limits

---

### 4. MockUSDC
- **Address:** `0x096731dc6CA1FF91702394F8c5C31dD989608e7B`
- **Type:** Test token (ERC20)
- **Solidity:** 0.8.19
- **Source File:** `contracts/src/MockUSDC.sol`
- **Status:** ⏳ Ready to verify
- **Snowtrace Link:** https://testnet.snowtrace.io/address/0x096731dc6CA1FF91702394F8c5C31dD989608e7B
- **Verification Command:**
  ```bash
  forge verify-contract 0x096731dc6CA1FF91702394F8c5C31dD989608e7B \
    src/MockUSDC.sol:MockUSDC \
    --rpc-url fuji \
    --verifier-url https://api-testnet.snowtrace.io/api \
    --etherscan-api-key $SNOWTRACE_API_KEY \
    --compiler-version v0.8.19 \
    --num-of-optimizations 200 \
    --evm-version paris
  ```
- **Notes:** Mock USDC for testnet with faucet function (6 decimals, standard USDC format)

---

## Batch Verification Script

Run all verifications at once:

```bash
# Make script executable
chmod +x VERIFY_CONTRACTS.sh

# Set API key
export SNOWTRACE_API_KEY="your_api_key_here"

# Run verifications
./VERIFY_CONTRACTS.sh
```

Or use the helper document: `SNOWTRACE_VERIFICATION.md`

---

## Compilation Settings Verification

**foundry.toml Settings:**
```toml
solc_version = "0.8.19"
evm_version = "paris"
optimizer = true
optimizer_runs = 200
via_ir = true
```

These must match in the Snowtrace verification form:
- Compiler Version: `v0.8.19`
- Optimization: `Yes` (200 runs)
- EVM Version: `Paris`
- License: `MIT`

---

## Contract Bytecode Verification

**Before verifying**, you can verify bytecode matches locally:

```bash
cd contracts

# Get on-chain bytecode
cast code 0xeD8bB8758d7231771279F4d24905E46B8febbAa1 --rpc-url fuji > onchain.bytecode

# Get local compiled bytecode
cat out/CausalOrganizations.sol/CausalOrganizations.json | jq -r '.bytecode.object' > local.bytecode

# Compare
if diff onchain.bytecode local.bytecode > /dev/null; then
  echo "Bytecode matches!"
else
  echo "Bytecode mismatch"
fi
```

---

## Verification Timeline

| Step | Action | Status | Date |
|------|--------|--------|------|
| 1 | Prepare verification guide | Complete | 2026-03-06 |
| 2 | Create verification script | Complete | 2026-03-06 |
| 3 | Verify CausalOrganizations | ⏳ Pending | — |
| 4 | Verify TreasuryFactory | ⏳ Pending | — |
| 5 | Verify ProposalFactoryDeployer | ⏳ Pending | — |
| 6 | Verify MockUSDC | ⏳ Pending | — |
| 7 | Update README | ⏳ Pending | — |
| 8 | Document mainnet plan | ⏳ Pending | — |

---

## Troubleshooting Guide

### Common Issues & Solutions

**Issue:** "Compiler version not found"
- **Solution:** Ensure using Solidity 0.8.19 exactly (not 0.8.24, not 0.8.17)
- **Check:** `solc --version`

**Issue:** "Constructor arguments don't match"
- **Solution:** Most contracts have no constructor args. If error persists, use manual verification
- **Check:** Review contract source file for constructor

**Issue:** "Optimization mismatch"
- **Solution:** Must be exactly 200 runs (not 1000, not 100)
- **Check:** foundry.toml shows `optimizer_runs = 200`

**Issue:** "Contract code not found at address"
- **Solution:** Verify address is on Fuji testnet (Chain ID: 43113)
- **Check:** https://testnet.snowtrace.io shows the contract

**Issue:** "Timeout during verification"
- **Solution:** Snowtrace queue may be busy. Try again in 10 minutes
- **Alternative:** Use manual UI verification instead of Foundry

---

## Post-Verification Tasks

After all 4 contracts are verified on Snowtrace:

1. **✓ Update README.md**
   - Add "Verified on Snowtrace ✓" badge for each contract
   - Link to contract source code on explorer

2. **✓ Announce on social media**
   - Share Snowtrace links
   - Highlight transparency and auditability

3. **✓ Prepare mainnet deployment**
   - Same contracts with mainnet addresses
   - Run same verification process on https://snowtrace.io (mainnet)

4. **✓ External audit**
   - Share verified source code
   - Prepare for security audit before mainnet

5. **✓ Update deployment docs**
   - Mark current testnet deployment as "Production-Ready"
   - Document mainnet deployment plan

---

## Resources

- **Snowtrace Testnet:** https://testnet.snowtrace.io
- **Snowtrace Mainnet:** https://snowtrace.io
- **Foundry Docs:** https://book.getfoundry.sh/
- **Avalanche Docs:** https://docs.avax.network/
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com/contracts/

---

## Notes

- All contracts compiled successfully with 0 errors
- Bytecode size constraints resolved with helper factory pattern
- No constructor arguments required for verification (all zero-args)
- EVM version "Paris" required for Avalanche C-Chain compatibility

