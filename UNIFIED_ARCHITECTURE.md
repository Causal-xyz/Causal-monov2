# CAUSAL - Unified Campaign/Organization Architecture

## 🎯 Core Concept

**Campaign → Organization Transformation**

CAUSAL implements a revolutionary fundraising model where successful campaigns **automatically transform into fully operational DAOs** with market-based governance.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMPAIGN PHASE                          │
│  • Fundraising with USDC                                    │
│  • Refundable if target not met                            │
│  • Automatic deployment on success                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Target Reached
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTOMATIC TRANSFORMATION                        │
│  1. Deploy Governance Token                                 │
│  2. Deploy Treasury                                         │
│  3. Deploy Organization (DAO)                               │
│  4. Transfer USDC to Treasury                               │
│  5. Distribute tokens to contributors                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  ORGANIZATION PHASE                          │
│  • Market-based governance                                  │
│  • YES/NO prediction markets                                │
│  • Price-determined execution                               │
│  • No oracles required                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Machine

### Campaign States

| State | Description | Transitions |
|-------|-------------|-------------|
| **FUNDING** | Accepting contributions | → FAILED (deadline + target not met)<br>→ LIVE (target reached) |
| **FAILED** | Target not reached | Terminal (refunds available) |
| **LIVE** | Converted to Organization | → LIQUIDATED (via vote) |
| **LIQUIDATED** | Assets distributed | Terminal |

### Proposal States

| State | Description | Next State |
|-------|-------------|------------|
| **TRADING** | Market open for trading | → CLOSED |
| **CLOSED** | Trading ended, outcome determined | → PASSED or REJECTED |
| **PASSED** | YES price > NO price | → EXECUTED |
| **REJECTED** | NO price > YES price | Terminal |
| **EXECUTED** | Funds transferred | Terminal |

---

## 🏗️ Smart Contract Architecture

### Core Contracts

#### 1. CampaignFactoryV2
```solidity
// Factory for deploying campaigns
function createCampaign(
    string name,
    string tokenName,
    uint256 fundingTarget,
    uint256 durationDays
) → address campaign
```

#### 2. CampaignV2
```solidity
// Fundraising → Organization transformation
States: FUNDING, FAILED, LIVE, LIQUIDATED

function contribute(uint256 amount) // Add USDC
function claimRefund() // If FAILED
function claimTokens() // If LIVE
```

#### 3. Organization
```solidity
// DAO with market governance
function createProposal(...) → uint256 proposalId
function executeProposal(uint256 proposalId)
function proposeLiquidation(...) → uint256 proposalId
function executeLiquidation()
```

#### 4. ProposalMarket
```solidity
// YES/NO AMM market (x·y=k)
function buy(bool isYes, uint256 usdcAmount)
function sell(bool isYes, uint256 tokenAmount)
function closeMarket() // Determine outcome
function claim() // Winners redeem USDC
```

#### 5. OrganizationTreasury
```solidity
// Holds organization funds
function executeTransfer(...) // Approved proposals only
function initiateLiquidation()
function claimLiquidation() // Proportional distribution
```

#### 6. OrganizationToken
```solidity
// ERC20 governance token
MAX_SUPPLY: 10M tokens
Distributed proportionally to contributors
```

---

## 🎮 User Flows

### A. Create Campaign

```
1. Founder calls campaignFactory.createCampaign(...)
2. Campaign contract deployed
3. Frontend shows in "Funding" section
4. Users can contribute USDC
```

### B. Campaign Success

```
1. totalRaised >= fundingTarget
2. Automatic deployment:
   - OrganizationToken created
   - OrganizationTreasury created
   - Organization (DAO) created via proxy
3. All USDC transferred to treasury
4. Contributors claim tokens proportionally
5. Frontend moves to "Organizations" section
```

### C. Campaign Failure

```
1. Deadline reached, target not met
2. Campaign state = FAILED
3. Contributors call claimRefund()
4. Full USDC returned
```

### D. Create Proposal

```
1. Token holder calls organization.createProposal(...)
2. ProposalMarket deployed automatically
3. Initial liquidity: 1000 USDC YES + 1000 USDC NO
4. Trading opens immediately
```

### E. Trade on Market

```
1. User calls market.buy(true, 500e6) // Buy 500 USDC of YES
2. Constant product formula calculates tokens
3. YES tokens credited to user
4. Reserves updated
5. Price shifts based on demand
```

### F. Proposal Execution

```
1. tradingEnd reached
2. Anyone calls market.closeMarket()
3. Compare: YES_price vs NO_price
4. If YES > NO: passed = true
5. Wait 1 day cooldown
6. Call organization.executeProposal(proposalId)
7. Treasury transfers USDC to recipient
```

### G. Liquidation

```
1. Token holder proposes liquidation
2. Market deployed for liquidation vote
3. If YES wins:
   - organization.executeLiquidation()
   - treasury.initiateLiquidation()
4. Token holders call treasury.claimLiquidation()
5. Proportional USDC distribution
```

---

## 💰 Economics

### Token Distribution

- **10M total supply** (fixed)
- Distributed **proportionally** to contributors
- No founder allocation
- No team tokens

### Market Mechanics

**Constant Product AMM**: `x · y = k`

**Price Calculation**:
```
YES_price = YES_reserve / (YES_reserve + NO_reserve)
NO_price = NO_reserve / (YES_reserve + NO_reserve)
```

**Initial State**:
- YES reserve: 1000 USDC
- NO reserve: 1000 USDC
- YES price: 50%
- NO price: 50%

**After Buying 500 USDC of YES**:
- NO reserve: 1500 USDC
- YES reserve: 666.67 USDC (k/1500)
- YES price: ~31%
- NO price: ~69%

### Treasury Management

- **100% USDC** from contributors
- **Controlled by DAO** via proposals
- **No founder access**
- **Liquidation rights** for token holders

---

## 🔒 Security Features

### Smart Contract Security

**ReentrancyGuard** on all state-changing functions
**SafeERC20** for token transfers
**Pull-over-push** pattern for refunds/claims
**UUPS upgradeable** pattern
**No external calls** before state updates
**Immutable critical addresses**

### Governance Security

**No oracle risk** - pure market prices
**1-day execution cooldown**
**Minimum trading period** (1-7 days)
**Token holder only** proposal creation
**Transparent on-chain** execution

### Economic Security

**100% refundable** if campaign fails
**Proportional distribution** always fair
**Market-determined** outcomes
**Liquidation escape hatch**

---

## 🎨 Frontend Architecture

### Page Structure

```
/
├── Landing
│   ├── Live Markets (all active proposals)
│   ├── Organizations (funded campaigns)
│   └── Leaderboard (trader stats)
│
├── /campaigns
│   ├── List all campaigns
│   ├── Filter: Funding | Failed | Live
│   └── Create campaign button
│
├── /campaigns/[id]
│   ├── Campaign details
│   ├── Contribute interface
│   ├── Progress bar
│   └── Contributor list
│
├── /organizations
│   └── List all live DAOs
│
├── /organizations/[id]
│   ├── Overview tab
│   │   ├── Treasury balance
│   │   ├── Token stats
│   │   └── Active proposals
│   ├── Proposals tab
│   │   └── Proposal cards
│   ├── Treasury tab
│   │   └── Spending history
│   └── Create Proposal tab
│
└── /proposals/[orgId]/[proposalId]
    ├── Description
    ├── Market prices (YES/NO %)
    ├── Trading interface
    ├── Liquidity chart
    └── Status badge
```

### Key Components

**CampaignCard**
```tsx
- Name, description
- Funding progress bar
- Time remaining
- Contributor count
- State badge
```

**OrganizationCard**
```tsx
- Organization name
- Treasury balance
- Token price
- Active proposal count
- Link to dashboard
```

**ProposalCard**
```tsx
- Title
- YES % | NO %
- Volume
- Time left
- Requested USDC
- Status (Trading/Passed/Rejected/Executed)
```

**MarketTradeModule**
```tsx
- Buy YES/NO buttons
- Amount input
- Slippage calculation
- Balance display
- Transaction confirmation
```

---

## 📝 Deployment Guide

### 1. Deploy Contracts

```bash
cd contracts
forge script script/DeployUnifiedSystem.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast \
  --legacy
```

### 2. Update Frontend Config

```typescript
// frontend/lib/config.ts
export const CONTRACTS = {
  campaignFactory: '0x1966817706D6ca1fDB4B62569A1f9059939858D5',
  usdc: '0x5425890298aed601595a70AB815c96711a31Bc65',
}
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

---

## 🧪 Testing Scenarios

### Test 1: Successful Campaign

1. Create campaign with 10,000 USDC target
2. Three users contribute: 4k, 3k, 3k
3. Target reached → automatic transformation
4. Check: Organization deployed
5. Check: Treasury has 10k USDC
6. Check: Token distribution (40%, 30%, 30%)

### Test 2: Failed Campaign

1. Create campaign with 10,000 USDC target
2. User contributes 5,000 USDC
3. Deadline passes
4. Call finalizeFailed()
5. User calls claimRefund()
6. Check: Full 5k USDC returned

### Test 3: Proposal Pass

1. Create proposal for 1,000 USDC
2. Market trades push YES to 60%
3. Trading period ends
4. Call closeMarket()
5. Check: passed = true
6. Wait 1 day cooldown
7. Call executeProposal()
8. Check: 1k USDC transferred

### Test 4: Proposal Reject

1. Create proposal
2. Market trades push NO to 70%
3. Trading ends
4. Call closeMarket()
5. Check: passed = false
6. No execution possible

### Test 5: Liquidation

1. Token holder proposes liquidation
2. Liquidation market deployed
3. YES wins with 65%
4. Call executeLiquidation()
5. Token holders call claimLiquidation()
6. Check: Proportional USDC distribution

---

## 📊 Contract Addresses (Fuji Testnet)

```
CampaignFactory: 0x1966817706D6ca1fDB4B62569A1f9059939858D5
Organization Impl: 0x8e19fDccE3eAa16abF7200158cC93406AC40870E
USDC: 0x5425890298aed601595a70AB815c96711a31Bc65
```

---

## 🚀 Key Innovations

1. **Automatic DAO Deployment** - No manual steps
2. **Oracle-Free Governance** - Pure market prices
3. **Fair Token Distribution** - Proportional to contribution
4. **Built-in Liquidation** - Protection for token holders
5. **Constant Product AMM** - Simple, proven formula
6. **Unified UX** - Campaign → Organization seamless transition

---

## 📚 Additional Resources

- Solidity Contracts: `/contracts/src/`
- Deployment Scripts: `/contracts/script/`
- Frontend: `/frontend/`
- Tests: `/contracts/test/`

---

