# Snowtrace Contract Verification Guide

## Overview

This guide walks through verifying the 4 main CAUSAL smart contracts on Avalanche Fuji testnet via Snowtrace for source code transparency.

**Network:** Avalanche Fuji Testnet
**Chain ID:** 43113
**Explorer:** https://testnet.snowtrace.io

---

## Deployed Contracts

| Contract | Address | Verified? |
|----------|---------|-----------|
| **CausalOrganizations** | `0xeD8bB8758d7231771279F4d24905E46B8febbAa1` | ⏳ Pending |
| **TreasuryFactory** | `0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134` | ⏳ Pending |
| **ProposalFactoryDeployer** | `0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83` | ⏳ Pending |
| **MockUSDC** | `0x096731dc6CA1FF91702394F8c5C31dD989608e7B` | ⏳ Pending |

---

## Prerequisites

1. **Snowtrace API Key** - Get one at: https://testnet.snowtrace.io/myapikey
2. **Foundry Installed** - Verify with `forge --version`
3. **Contract Source Code** - Already available in `CAUSAL/contracts/src/`
4. **Compiler Settings** - Solidity 0.8.19, Paris EVM, via-IR enabled

---

## Method 1: Using Foundry (Recommended)

### Step 1: Get Snowtrace API Key

1. Go to https://testnet.snowtrace.io/myapikey
2. Sign in or create an account
3. Copy your API key
4. Set environment variable: `export SNOWTRACE_API_KEY="your_key_here"`

### Step 2: Verify Each Contract

#### 1. CausalOrganizations

```bash
cd CAUSAL/contracts

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

**Expected Output:**
```
Waiting for verification result...
Contract verified successfully
```

#### 2. TreasuryFactory

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

#### 3. ProposalFactoryDeployer

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

#### 4. MockUSDC

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

---

## Method 2: Manual Verification via Snowtrace UI

If Foundry verification fails, you can verify manually:

### Step 1: Get Flattened Source Code

```bash
cd CAUSAL/contracts

# Generate flattened source for CausalOrganizations
forge flatten src/CausalOrganizations.sol > CausalOrganizations.flat.sol

# Repeat for other contracts
forge flatten src/TreasuryFactory.sol > TreasuryFactory.flat.sol
forge flatten src/ProposalFactoryDeployer.sol > ProposalFactoryDeployer.flat.sol
forge flatten src/MockUSDC.sol > MockUSDC.flat.sol
```

### Step 2: Go to Snowtrace Explorer

For **CausalOrganizations**:

1. Navigate to: https://testnet.snowtrace.io/address/0xeD8bB8758d7231771279F4d24905E46B8febbAa1
2. Click **"Code"** tab
3. Click **"Verify & Publish"** button
4. Select compiler type: **Solidity (Single file)**
5. Compiler version: **v0.8.19**
6. Optimization: **Yes** (200 runs)
7. EVM Version: **Paris**
8. Paste the flattened source code from step 1
9. Click **"Verify & Publish"**

Repeat for the other three contracts using their respective addresses and flattened source files.

---

## Verification Status Check

After submission, you can check verification status:

**For CausalOrganizations:**
```
https://testnet.snowtrace.io/address/0xeD8bB8758d7231771279F4d24905E46B8febbAa1#code
```

Look for the green checkmark next to the contract name when verification is complete.

---

## Compilation Settings Reference

All contracts use these settings (defined in `foundry.toml`):

```toml
solc_version = "0.8.19"
evm_version = "paris"
optimizer = true
optimizer_runs = 200
via_ir = true
```

**Important:** Must match exactly for successful verification.

---

## Contract Overview

### CausalOrganizations (Main)
- **Purpose:** Singleton orchestrator for all organization fundraising
- **Functions:** createOrganization, contribute, finalizeRaise, claim, createProposal
- **Dependencies:** OrgToken, TreasuryV2, TreasuryFactory, ProposalFactoryDeployer
- **Key Feature:** Time-weighted token allocation + discretionary cap

### TreasuryFactory (Helper)
- **Purpose:** Deploys TreasuryV2 instances per organization
- **Reason:** Avoids bytecode size limits in CausalOrganizations
- **Size:** ~15KB

### ProposalFactoryDeployer (Helper)
- **Purpose:** Deploys ProposalFactoryV2 instances per organization
- **Reason:** Avoids bytecode size limits in CausalOrganizations
- **Size:** ~18KB

### MockUSDC (Test Token)
- **Purpose:** ERC20 token for testnet USDC
- **Features:** Faucet function for test tokens
- **Decimals:** 6 (standard USDC)
- **Initial Supply:** Minted to deployer

---

## Troubleshooting

### Error: "Compiler version mismatch"
- Ensure `solc_version = "0.8.19"` in foundry.toml
- Check Snowtrace shows v0.8.19 available

### Error: "Constructor arguments mismatch"
- Most contracts have no constructor arguments
- If error persists, use `forge flatten` and manual verification

### Error: "Optimization runs mismatch"
- Must be exactly 200 (as per foundry.toml)
- Double-check in verification form

### Verification times out
- Try again in 10 minutes
- Snowtrace queue may be busy
- Consider manual UI verification

---

## Post-Verification Checklist

- [ ] CausalOrganizations verified on Snowtrace
- [ ] TreasuryFactory verified on Snowtrace
- [ ] ProposalFactoryDeployer verified on Snowtrace
- [ ] MockUSDC verified on Snowtrace
- [ ] All show green checkmarks on explorer
- [ ] Source code is readable on Snowtrace
- [ ] Contract interactions show ABI functions

---

## Verification Benefits

✅ **Transparency** - Users can see exact contract code
✅ **Security** - Source code visible for audit
✅ **Trust** - Proves contracts match bytecode on-chain
✅ **Usability** - Snowtrace shows readable contract interface

---

## Next Steps

After verification:

1. **Update deployment docs** with "Verified ✓" status
2. **Test all contract interactions** via Snowtrace UI
3. **Share verified contract addresses** with community
4. **Prepare for mainnet deployment** with same verification process

---

## Support

- **Snowtrace Docs:** https://docs.snowtrace.io/
- **Foundry Docs:** https://book.getfoundry.sh/
- **Avalanche C-Chain:** https://docs.avax.network/
