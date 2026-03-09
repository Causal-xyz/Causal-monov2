# Mainnet Deployment Plan

**Status:** Ready to Deploy (Post-Verification)
**Target Network:** Avalanche C-Chain Mainnet
**Chain ID:** 43114
**Timeline:** After Snowtrace verification + external audit

---

## Pre-Deployment Checklist

### Phase 1: Testing (Done)
- [ ] All contracts compile without errors
- [ ] Proposal trading page fully functional
- [ ] End-to-end flow tested on Fuji testnet
- [ ] All 4 contracts verified on testnet Snowtrace
- [ ] Contract interactions tested via Snowtrace UI

### Phase 2: Verification (Done)
- [ ] CausalOrganizations verified on Snowtrace
- [ ] TreasuryFactory verified on Snowtrace
- [ ] ProposalFactoryDeployer verified on Snowtrace
- [ ] MockUSDC verified on Snowtrace
- [ ] Mainnet addresses prepared

### Phase 3: Audit (Pre-Deployment)
- [ ] External security audit completed
- [ ] Audit report reviewed and issues resolved
- [ ] Multisig wallet prepared for admin functions

### Phase 4: Launch (Final)
- [ ] Contracts deployed to mainnet
- [ ] Contracts verified on mainnet Snowtrace
- [ ] Frontend updated with mainnet addresses
- [ ] Frontend deployed to production
- [ ] Announcement to community

---

## Deployment Configuration

### Testnet (Current - Fuji)
```
Network: Avalanche Fuji Testnet
Chain ID: 43113
RPC: https://api.avax-test.network/ext/bc/C/rpc
Explorer: https://testnet.snowtrace.io
```

### Mainnet (Target)
```
Network: Avalanche C-Chain
Chain ID: 43114
RPC: https://api.avax.network/ext/bc/C/rpc
Explorer: https://snowtrace.io
```

### Contract Parameters (No Changes Needed)
All contract logic is identical for mainnet. Only parameters to adjust:

#### In CausalOrganizations.sol (if changes needed):
```solidity
// Current testnet settings (keep for mainnet):
uint256 private constant PRECISION  = 1e18;
uint256 private constant CAP_WINDOW = 3 days;  // time for founder to set cap post-sale

// Optional: Adjust launch fee if desired
uint256 public launchFee;  // currently 0 on testnet
```

#### In ConditionalProposal.sol (if changes needed):
```solidity
// Current phase durations (EXCELLENT FOR MAINNET):
uint256 constant TRADING_DURATION = 5 minutes;      // Time to trade (testnet only!)
uint256 constant PENDING_DURATION = 30 seconds;     // Wait before recording (testnet)
uint256 constant RECORDING_DURATION = 1 minute;     // TWAP observation period (testnet)

// RECOMMENDED MAINNET OVERRIDES:
// Uncomment these and update CausalOrganizations to use them:
// uint256 constant TRADING_DURATION = 3 days;
// uint256 constant PENDING_DURATION = 24 hours;
// uint256 constant RECORDING_DURATION = 3 days;
```

---

## Deployment Steps

### Step 1: Prepare Environment

```bash
cd contracts

# Create mainnet .env file
cp .env.example .env.mainnet

# Add mainnet private key
echo "PRIVATE_KEY=0x..." >> .env.mainnet
echo "SNOWTRACE_API_KEY=..." >> .env.mainnet
```

### Step 2: Deploy Contracts

```bash
# Load mainnet environment
source .env.mainnet

# Deploy all contracts to mainnet
forge script script/DeployCausalOrganizations.s.sol:Deploy \
  --rpc-url https://api.avax.network/ext/bc/C/rpc \
  --broadcast \
  --verify

# Save output! Example:
# ========================================
# Deployment Complete!
# ========================================
# CausalOrganizations: 0x...
# TreasuryFactory: 0x...
# ProposalFactoryDeployer: 0x...
# MockUSDC: 0x... (optional, can use real USDC)
# ========================================
```

### Step 3: Use Real USDC (Recommended)

On mainnet, **do NOT deploy MockUSDC**. Instead, use the official Avalanche USDC:

```
Official Avalanche C-Chain USDC:
Address: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
Decimals: 6
Verified: Yes
```

Update the deployment script to use this address instead of deploying MockUSDC.

### Step 4: Update Frontend Configuration

Edit `frontend/lib/config.ts`:

```typescript
// Change from:
export const CONTRACTS = {
  organizationFactoryV2: '0xeD8bB8758d7231771279F4d24905E46B8febbAa1', // testnet
  usdc: '0xcb5476cb8b6dF47Bd85B9528B0F049F14a80de2b', // testnet MockUSDC
  // ... testnet addresses
}

// To:
export const CONTRACTS = {
  organizationFactoryV2: '0xNEWMAINNETADDRESS', // mainnet deployment
  usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // real USDC on Avalanche
  // ... mainnet addresses
}

// Change chain:
import { avalancheFuji } from 'wagmi/chains' // testnet
// To:
import { avalanche } from 'wagmi/chains' // mainnet
```

### Step 5: Verify Contracts on Mainnet

```bash
# Verify each contract on mainnet Snowtrace
forge verify-contract <MAINNET_ADDRESS> \
  src/CausalOrganizations.sol:CausalOrganizations \
  --rpc-url https://api.avax.network/ext/bc/C/rpc \
  --verifier-url https://api.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris

# Verify TreasuryFactory, ProposalFactoryDeployer, and real USDC similarly
```

### Step 6: Deploy Frontend

```bash
cd frontend

# Build for production
npm run build

# Deploy to hosting (e.g., Vercel, Netlify, AWS)
# Example with Vercel:
vercel --prod
```

---

## Phase Duration Configuration (Critical!)

**Current testnet timings** (fast for testing):
- Sale: 1 minute
- Pending: 30 seconds
- Trading: 5 minutes
- Recording: 1 minute
- **Total cycle: ~8 minutes**

**Recommended mainnet timings** (realistic governance):
- Sale: 7 days (let community commit)
- Pending: 24 hours (waiting period)
- Trading: 3 days (market discovery)
- Recording: 3 days (TWAP observation)
- **Total cycle: ~14 days**

### To Change for Mainnet:

Edit `src/ConditionalProposal.sol`:

```solidity
// Line ~50 (example - check actual file):
uint256 constant TRADING_DURATION = 3 days;      // 5 minutes testnet → 3 days mainnet
uint256 constant PENDING_DURATION = 24 hours;    // 30 seconds testnet → 24 hours mainnet
uint256 constant RECORDING_DURATION = 3 days;    // 1 minute testnet → 3 days mainnet
```

Recompile and redeploy with updated timings.

---

## Security Considerations for Mainnet

### 1. Access Control
```solidity
// CausalOrganizations.sol should have:
address public owner;  // Should be multisig wallet
```

**Before mainnet launch:**
- Transfer ownership from deployer EOA to 2-of-3 multisig
- Use tools like Gnosis Safe for mainnet

### 2. Emergency Pause
Add pause mechanism if not present:
```solidity
// Recommended for mainnet:
bool public paused;
modifier whenNotPaused() { require(!paused); _; }
```

### 3. Launch Fee
Consider enabling launch fee for sustainability:
```solidity
uint256 public launchFee = 0.1 ether;  // small AVAX fee per organization
```

### 4. Initial Liquidity
Ensure adequate liquidity for early organizations:
- Pre-mint governance tokens for core team
- Allocate treasury for market making
- Establish minimum requirements

---

## Post-Launch Monitoring

### Key Metrics to Track
- Number of organizations created
- Total USDC raised
- Proposal success rate
- Market trading volume
- User engagement

### Maintenance Tasks
- Monitor contract health
- Track gas costs vs. revenue
- Gather community feedback
- Plan Phase 2 features

---

## Phase 2 Features (Post-Launch)

After successful mainnet launch, consider:

1. **Uniswap V3 Integration**
   - Token trading pool
   - Liquidity pools per organization

2. **Token Vesting**
   - Team allocation vesting schedules
   - Cliff + monthly release

3. **Governance**
   - DAO token staking
   - Proposal voting with vote weight

4. **Analytics**
   - The Graph subgraph
   - Dashboard with on-chain data

5. **Cross-Chain**
   - Bridge to Ethereum L2s
   - Multi-chain deployment

---

## Rollback Plan (If Issues Found)

If critical issues discovered post-launch:

1. **Pause Operations**
   - Activate emergency pause in CausalOrganizations
   - Prevent new organizations/proposals

2. **Freeze Assets**
   - Halt USDC withdrawals (treasury remains locked)
   - Protect user funds

3. **Deploy Patch**
   - Fix contract code
   - Redeploy to new address
   - Migrate state if needed

4. **Communicate**
   - Explain issue to community
   - Provide clear timeline for recovery

---

## Success Criteria

Mainnet deployment is successful when:

All contracts deployed and verified
Frontend connects to mainnet contracts
First organization creates successfully
ICO fundraising works end-to-end
Proposal creation and trading functional
Users can claim tokens post-sale
USDC treasury receives and holds funds safely
Market pricing algorithm working correctly
No critical issues or exploits found

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Testnet Verification | Complete | Done |
| External Audit | 2-4 weeks | Pending |
| Fixes/Adjustments | 1-2 weeks | Pending |
| Mainnet Preparation | 3-5 days | Pending |
| Mainnet Deployment | 1 day | Pending |
| **Total:** | **4-6 weeks** | — |

---

## Support & Documentation

- **Contract ABIs:** In `contracts/out/` after build
- **Deployment Scripts:** In `contracts/script/`
- **Frontend Config:** `frontend/lib/config.ts`
- **Explorer Links:** https://snowtrace.io
- **Docs:** See README.md in each folder

---

## Contact & Approval

Before proceeding with mainnet deployment:

- [ ] Security audit approved
- [ ] Team sign-off received
- [ ] Marketing/communications ready
- [ ] Community notified of launch plan
- [ ] Emergency procedures documented

---

**Ready to launch CAUSAL on Avalanche mainnet! **

