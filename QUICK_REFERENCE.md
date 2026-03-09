# CAUSAL Quick Reference Card

## Current Status
- **Testnet:** All 4 contracts deployed and fully tested
- **Frontend:** 7 pages complete, all features working
- ⏳ **Next:** Snowtrace verification → External audit → Mainnet

---

## 📋 Deploy Addresses (Avalanche Fuji)

| Contract | Address |
|----------|---------|
| **CausalOrganizations** | `0xeD8bB8758d7231771279F4d24905E46B8febbAa1` |
| **TreasuryFactory** | `0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134` |
| **ProposalFactoryDeployer** | `0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83` |
| **MockUSDC** | `0x096731dc6CA1FF91702394F8c5C31dD989608e7B` |

---

## What's Complete

### Contracts
- CausalOrganizations (singleton, all orgs)
- TreasuryFactory (per-org treasury)
- ProposalFactoryDeployer (per-org proposals)
- MockUSDC (testnet token)
- Auto-deployed: OrgToken, TreasuryV2, ProposalFactoryV2, ConditionalMarket

### Frontend Pages
- `/` - Home
- `/organizations` - Browse orgs
- `/organizations/[id]` - Org detail
- `/organizations/[id]/dashboard` - Create proposals
- `/organizations/[id]/proposals/[proposalAddress]` - **Trading page** ✅
- `/trade-decisions` - Global proposals
- `/admin` - Admin tools

### Features
- Time-weighted token allocation
- Discretionary cap system
- Conditional markets (PASS/FAIL)
- LMSR pricing
- TWAP-based resolution
- Live price chart
- Wallet connection (Core, Metamask)
---

## 📚 Documentation Map

| Document | Purpose | Read if... |
|----------|---------|-----------|
| `SNOWTRACE_VERIFICATION.md` | Full verification guide | You want to verify contracts |
| `VERIFY_CONTRACTS.sh` | Batch verification script | You want quick verification |
| `VERIFICATION_STATUS.md` | Status tracker | You want checklist + links |
| `MAINNET_DEPLOYMENT_PLAN.md` | Mainnet deployment guide | You're preparing for mainnet |
| `QUICK_REFERENCE.md` | This page | You need quick info |
| `README.md` | Project overview | You're new to CAUSAL |
| `UNIFIED_ARCHITECTURE.md` | Technical architecture | You're auditing code |

---

## 🔧 Common Commands

### Compile Contracts
```bash
cd CAUSAL/contracts
forge build
```

### Run Tests
```bash
cd CAUSAL/contracts
forge test
```

### Flatten Contract for Manual Verification
```bash
forge flatten src/CausalOrganizations.sol > CausalOrganizations.flat.sol
```

### Deploy Script
```bash
forge script script/DeployCausalOrganizations.s.sol:Deploy \
  --rpc-url fuji \
  --broadcast
```

### Check Contract on Explorer
```
https://testnet.snowtrace.io/address/0xeD8bB8758d7231771279F4d24905E46B8febbAa1
```

---

## Key Links

### Testnet (Fuji)
- Explorer: https://testnet.snowtrace.io
- RPC: https://api.avax-test.network/ext/bc/C/rpc
- Faucet: https://faucet.avax.network

### Mainnet
- Explorer: https://snowtrace.io
- RPC: https://api.avax.network/ext/bc/C/rpc
- USDC: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`

### Documentation
- Solidity: https://docs.soliditylang.org/
- Foundry: https://book.getfoundry.sh/
- Avalanche: https://docs.avax.network/
- OpenZeppelin: https://docs.openzeppelin.com/contracts/

---

## Important Notes

### Testnet Timing (DO NOT USE FOR MAINNET)
```
Sale:      1 minute      ← Change to 7 days
Pending:   30 seconds    ← Change to 24 hours
Trading:   5 minutes     ← Change to 3 days
Recording: 1 minute      ← Change to 3 days
```

### Use Real USDC on Mainnet
```
Testnet: 0xcb547... (MockUSDC with faucet)
Mainnet: 0xB97EF... (Real USDC, no changes needed)
```

### Contract Sizes
```
CausalOrganizations:      ~18KB 
TreasuryFactory:          ~15KB 
ProposalFactoryDeployer:  ~18KB 
(All under 24KB EVM limit)
```

---

## Phase Durations

### Current (Testnet)
```
Total Cycle: ~8 minutes

Proposal Creation
    ↓
Staking Phase: 1 min
    ↓ (once 500k tokens staked)
Trading Phase: 5 min
    ↓
Pending Phase: 30 sec
    ↓
Recording Phase: 1 min (TWAP collection)
    ↓
Resolution: Compare TWAP
    ↓
Execution: If PASS > FAIL
```

### For Mainnet
```
Total Cycle: ~14 days

Proposal Creation
    ↓
Staking Phase: ??? (no time limit, just need 500k)
    ↓
Trading Phase: 3 days
    ↓
Pending Phase: 24 hours
    ↓
Recording Phase: 3 days (TWAP collection)
    ↓
Resolution: Compare TWAP
    ↓
Execution: If PASS > FAIL
```

---

## Success Criteria

Before mainnet launch, verify:

- [ ] All 4 contracts verified on testnet Snowtrace
- [ ] External audit completed and signed off
- [ ] Phase durations updated to realistic values
- [ ] Frontend config updated with mainnet addresses
- [ ] Multisig wallet prepared for admin
- [ ] Community notified of launch plan
- [ ] MockUSDC replaced with real USDC address
- [ ] All emergency procedures documented

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| **Current (Testnet)** | Complete | Done |
| **Snowtrace Verify** | Complete | Done |
| **External Audit** | 2-4 weeks | ⏳ Next |
| **Mainnet Prep** | 3-5 days | ⏳ After audit |
| **Mainnet Deploy** | 1 day | ⏳ Final |
| **Total to Mainnet** | **4-6 weeks** | — |
---

