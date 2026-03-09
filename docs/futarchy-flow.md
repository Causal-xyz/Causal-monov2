# Futarchy Protocol — Detailed Flow Documentation

## Table of Contents

1. [What is Futarchy?](#1-what-is-futarchy)
2. [System Architecture](#2-system-architecture)
3. [Contract Overview](#3-contract-overview)
4. [Complete Lifecycle](#4-complete-lifecycle)
5. [Phase 1: Proposal Creation](#5-phase-1-proposal-creation)
6. [Phase 2: AMM Setup](#6-phase-2-amm-setup)
7. [Phase 3: Token Splitting](#7-phase-3-token-splitting)
8. [Phase 4: Trading Period](#8-phase-4-trading-period)
9. [Phase 5: Token Merging](#9-phase-5-token-merging)
10. [Phase 6: Resolution](#10-phase-6-resolution)
11. [Phase 7: Redemption](#11-phase-7-redemption)
12. [Phase 8: Execution](#12-phase-8-execution)
13. [TWAP Oracle Mechanism](#13-twap-oracle-mechanism)
14. [Token Flow Diagrams](#14-token-flow-diagrams)
15. [Access Control Model](#15-access-control-model)
16. [Error Handling](#16-error-handling)
17. [Events Reference](#17-events-reference)
18. [Security Considerations](#18-security-considerations)

---

## 1. What is Futarchy?

Futarchy is a governance model proposed by economist Robin Hanson where **decisions are made by markets, not votes**. Instead of asking people "Do you support proposal X?", futarchy asks "What does the market think will happen if proposal X passes?"

The core idea:

> **Vote on values, bet on beliefs.**

In this implementation, a proposal's outcome (Yes or No) is determined by comparing the **market prices** of conditional tokens. If the "Yes" conditional tokens trade at a higher price than the "No" conditional tokens, the market believes the proposal will have a positive outcome — and the proposal passes.

### Why Futarchy?

| Traditional Voting | Futarchy |
|---|---|
| One person, one vote | One dollar, one vote (skin in the game) |
| No cost to voting wrong | Financial loss for wrong predictions |
| Susceptible to popularity bias | Prices aggregate dispersed information |
| No incentive to research | Direct profit incentive for informed participation |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FutarchyFactoryPoc                         │
│                    (Proposal Registry)                           │
│                                                                  │
│  createProposal() ──► deploys new FutarchyProposalPoc            │
│  proposals[id] ──► stores proposal addresses                     │
│  proposalCount ──► auto-incrementing ID                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ deploys
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FutarchyProposalPoc                           │
│                  (Core Proposal Logic)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │  4x ConditionalToken (ERC20)                  │               │
│  │  ├── yesX   (Token X YES)                     │               │
│  │  ├── noX    (Token X NO)                      │               │
│  │  ├── yesUsdc (USDC YES)                       │               │
│  │  └── noUsdc  (USDC NO)                        │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │  2x Uniswap V3 Pools (AMMs)                  │               │
│  │  ├── YES Pool: yesX / yesUsdc                 │               │
│  │  └── NO Pool:  noX  / noUsdc                  │               │
│  └──────────────────────────────────────────────┘               │
│                                                                  │
│  split / merge / resolve / redeem                                │
└─────────────────────────────────────────────────────────────────┘
```

### Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| OpenZeppelin ERC20 | v5.6.1 | Base token standard |
| OpenZeppelin Ownable | v5.6.1 | Access control |
| OpenZeppelin ReentrancyGuard | v5.6.1 | Reentrancy protection |
| OpenZeppelin SafeERC20 | v5.6.1 | Safe token transfers |
| Uniswap V3 Core | v1.0.0 | Pool factory, oracle |
| Uniswap V3 Periphery | v1.3.0 | Position manager, liquidity |

---

## 3. Contract Overview

### 3.1 ConditionalToken

A specialized ERC20 token representing a conditional claim on an underlying asset. It can only be minted/burned by its **manager** (the `FutarchyProposalPoc` contract that deployed it).

```
ConditionalToken
├── manager (immutable)     → FutarchyProposalPoc address
├── _tokenDecimals          → matches underlying token's decimals
├── mint(to, amount)        → only manager can call
├── burn(from, amount)      → only manager can call
└── decimals()              → returns _tokenDecimals
```

**Key property**: 1 conditional token always represents a claim on exactly 1 underlying token. If you hold 100 `yesX` tokens and "Yes" wins, you can redeem them for exactly 100 `tokenX`.

### 3.2 FutarchyProposalPoc

The core contract managing the full proposal lifecycle.

**Immutable state** (set at construction, never changes):
- `proposalId` — unique identifier
- `title` — human-readable proposal name
- `tokenX` — the governance/project token
- `usdc` — the stablecoin used for pricing
- `transferToken` — token to transfer if Yes wins
- `recipient` — who receives the transfer
- `transferAmount` — how much to transfer
- `resolutionTimestamp` — when resolution becomes possible
- `twapWindow` — TWAP oracle observation window in seconds (minimum 60)
- `yesX`, `noX`, `yesUsdc`, `noUsdc` — the 4 conditional tokens

**Mutable state** (changes during lifecycle):
- `outcome` — starts `Unresolved`, becomes `Yes` or `No`
- `ammYesPair` / `ammNoPair` — Uniswap V3 pool addresses (set once)
- `yesPositionTokenId` / `noPositionTokenId` — LP NFT IDs

### 3.3 FutarchyFactoryPoc

Factory contract that deploys new proposals and maintains a registry.

```
FutarchyFactoryPoc
├── proposalCount               → auto-incrementing counter
├── proposals[id]               → mapping from ID to proposal address
├── createProposal(...)         → onlyOwner, deploys proposal without AMM
├── createProposalWithAmm(...)  → onlyOwner, deploys proposal + AMM pools in one tx
└── _deployProposal(...)        → internal shared deployment logic
```

---

## 4. Complete Lifecycle

```
    ┌──────────────┐
    │   CREATION   │  Factory owner creates proposal
    │   Phase 1    │  4 conditional tokens deployed
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  AMM SETUP   │  Owner sets up Uniswap V3 pools
    │   Phase 2    │  Initial liquidity provided
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  SPLITTING   │  Users deposit tokenX or USDC
    │   Phase 3    │  Receive yes/no conditional pairs
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   TRADING    │  Users trade on Uniswap V3 pools
    │   Phase 4    │  Price discovery happens here
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   MERGING    │  Users can exit by merging pairs
    │   Phase 5    │  Get back underlying tokens
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  RESOLUTION  │  After timestamp: compare TWAPs
    │   Phase 6    │  Outcome = Yes or No
    └──────┬───────┘
           │
       ┌───┴────┐
       ▼        ▼
  ┌─────────┐ ┌─────────┐
  │YES WINS │ │ NO WINS │
  │Phase 7+8│ │ Phase 7 │
  └─────────┘ └─────────┘
       │           │
       ▼           ▼
  ┌──────────────────────┐
  │     REDEMPTION       │  Winners burn conditional tokens
  │      Phase 7         │  Receive underlying assets
  └──────────────────────┘
```

**Important**: Phases 3, 4, and 5 (splitting, trading, merging) happen concurrently during the active proposal period. Users can split, trade, and merge at any time before resolution.

---

## 5. Phase 1: Proposal Creation

### Who: Factory owner

### How: `FutarchyFactoryPoc.createProposal()`

```
Factory Owner
     │
     │  createProposal(title, tokenX, usdc, resolutionTimestamp,
     │                  transferToken, recipient, transferAmount,
     │                  usdcRequested, tokensToMint, twapWindow_)
     ▼
┌─────────────────────────┐
│   FutarchyFactoryPoc    │
│                         │
│  1. proposalCount++     │
│  2. Deploy new          │
│     FutarchyProposalPoc │
│  3. Store in registry   │
│     proposals[id] = addr│
│  4. Return address      │
└────────────┬────────────┘
             │ deploys
             ▼
┌─────────────────────────────────────────┐
│       FutarchyProposalPoc               │
│                                         │
│  Constructor:                           │
│  1. Validate addresses ≠ 0             │
│  1b. Validate twapWindow ≥ 60          │
│  2. Store immutable config              │
│  3. Read tokenX symbol & decimals       │
│  4. Read USDC symbol & decimals         │
│  5. Deploy 4 ConditionalTokens:         │
│     ├── yesX  ("ETH YES (P1)", "yETH-P1")  │
│     ├── noX   ("ETH NO (P1)",  "nETH-P1")  │
│     ├── yesUsdc("USDC YES (P1)","yUSDC-P1") │
│     └── noUsdc ("USDC NO (P1)", "nUSDC-P1") │
│                                         │
│  State: outcome = Unresolved            │
│  State: AMMs = not set yet              │
└─────────────────────────────────────────┘
```

### Constructor Parameters Explained

| Parameter | Type | Description |
|---|---|---|
| `title` | string | Human-readable proposal name |
| `tokenX` | address | The governance/project token (e.g., ETH, WBTC) |
| `usdc` | address | Stablecoin for pricing (e.g., USDC, USDT) |
| `resolutionTimestamp` | uint256 | Unix timestamp after which resolution is allowed |
| `transferToken` | address | Token transferred to recipient if Yes wins |
| `recipient` | address | Who receives tokens on Yes outcome |
| `transferAmount` | uint256 | How much to transfer on Yes outcome |
| `usdcRequested` | uint256 | USDC to spend from treasury on Yes (treasury mode) |
| `tokensToMint` | uint256 | Governance tokens to mint via treasury on Yes |
| `twapWindow_` | uint32 | TWAP oracle observation window in seconds (min 60) |

### Conditional Token Naming Convention

For proposal ID 1 with tokenX = ETH and usdc = USDC:

| Token | Full Name | Symbol |
|---|---|---|
| yesX | "ETH YES (P1)" | yETH-P1 |
| noX | "ETH NO (P1)" | nETH-P1 |
| yesUsdc | "USDC YES (P1)" | yUSDC-P1 |
| noUsdc | "USDC NO (P1)" | nUSDC-P1 |

---

## 6. Phase 2: AMM Setup

### Who: Proposal owner or factory

There are **three paths** to set up AMM pools:

| Path | Function | Who | When |
|------|----------|-----|------|
| **A. During creation** | `factory.createProposalWithAmm()` | Factory owner | At proposal creation (recommended) |
| **B. After creation (new)** | `proposal.setupAmmWithLiquidity()` | Owner or factory | After creation, pulls tokens from caller |
| **C. After creation (legacy)** | `proposal.createAndSetAmms()` | Owner only | After manual split + USDC transfer to contract |

### Path A: Create Proposal with AMM (Recommended)

The simplest path — deploys the proposal and sets up AMM pools in a single atomic transaction.

**User flow**: Approve tokenX → Approve USDC → Call `createProposalWithAmm()` (3 txs total)

The factory pulls tokenX + USDC from the caller, approves them to the proposal, and calls `setupAmmWithLiquidity()`.

### Path B: Setup AMM After Creation

For proposals created without AMM. The owner calls `setupAmmWithLiquidity()` directly on the proposal, which pulls tokenX + USDC from the caller, splits tokenX into yesX/noX, splits USDC 50/50 between pools, and creates AMMs.

### Path C: Legacy Manual Setup

### How: `FutarchyProposalPoc.createAndSetAmms()`

This is the original path kept for backward compatibility. It creates two Uniswap V3 pools using tokens already held by the contract.

### Prerequisites (Path C only)

Before calling `createAndSetAmms()`, the owner must:
1. Split some tokenX into yesX + noX (via `splitX()`)
2. Split some USDC into yesUsdc + noUsdc (via `splitUsdc()`)
3. Ensure the contract holds enough tokens for initial liquidity

### Step-by-Step Flow

```
Owner
  │
  │  createAndSetAmms(factory, positionManager, fee,
  │                   initialPriceYes, initialPriceNo,
  │                   yesXAmount, noXAmount,
  │                   usdcForYes, usdcForNo)
  ▼
┌──────────────────────────────────────────────────────────────┐
│  VALIDATION                                                   │
│  1. AMMs not already set (can only be called once)            │
│  2. Fee tier is valid (tickSpacing ≠ 0)                      │
│  3. Contract has enough yesX, noX, and USDC balance           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  POOL CREATION (YES Pool)                                     │
│                                                                │
│  1. Sort tokens: determine if yesX < usdc (address order)     │
│     Uniswap V3 requires token0 < token1                       │
│  2. Call positionManager.createAndInitializePoolIfNecessary()  │
│     ├── token0, token1 (sorted)                                │
│     ├── fee tier                                               │
│     └── initialPriceYesXUsdcSqrtX96 (starting price)          │
│  3. Verify pool address ≠ 0                                  │
│  4. Store as ammYesPair (IOracle)                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  POOL CREATION (NO Pool)                                      │
│                                                                │
│  Same process for noX / USDC pair                              │
│  Store as ammNoPair (IOracle)                                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  APPROVE TOKENS                                                │
│                                                                │
│  forceApprove yesX → positionManager                          │
│  forceApprove noX  → positionManager                          │
│  forceApprove usdc → positionManager (combined amount)        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  ADD LIQUIDITY (YES Pool)                                      │
│                                                                │
│  positionManager.mint({                                        │
│    token0, token1 (sorted),                                    │
│    fee,                                                        │
│    tickLower: -887272 (full range, rounded to tick spacing),   │
│    tickUpper:  887272 (full range, rounded to tick spacing),   │
│    amount0Desired, amount1Desired,                             │
│    amount0Min: 0, amount1Min: 0,                               │
│    recipient: this contract,                                   │
│    deadline: now + 1 hour                                      │
│  })                                                            │
│                                                                │
│  Returns: NFT tokenId, liquidity, actual amounts used          │
│  Verify: liquidity > 0, both amounts > 0                      │
│  Store: yesPositionTokenId                                     │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  ADD LIQUIDITY (NO Pool)                                       │
│                                                                │
│  Same process for the NO pool                                  │
│  Store: noPositionTokenId                                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
              Emit AmmsSet event
```

### Full-Range Tick Calculation

The `_fullRangeTicks()` function calculates the widest possible liquidity range:

```
MAX_TICK = 887272 (Uniswap V3 constant)

tickLower = (-887272 / tickSpacing) * tickSpacing
tickUpper = ( 887272 / tickSpacing) * tickSpacing
```

For fee tier 3000 (0.3%), tickSpacing = 60:
- tickLower = (-887272 / 60) * 60 = -887220
- tickUpper = (887272 / 60) * 60 = 887220

This means liquidity is provided across the **entire possible price range**, similar to Uniswap V2 behavior.

### Initial Price (sqrtPriceX96)

The `initialPriceYesXUsdcSqrtX96` parameter sets the starting price of the pool. It uses Uniswap V3's fixed-point Q96 format:

```
sqrtPriceX96 = sqrt(price) × 2^96
```

Where `price = token1 / token0` (amount of token1 per token0).

---

## 7. Phase 3: Token Splitting

### Who: Any user

### How: `splitX()` or `splitUsdc()`

Splitting is the mechanism by which users enter the prediction market. By depositing a base token, they receive **equal amounts** of both yes and no conditional tokens.

### splitX Flow

```
User deposits 100 tokenX
         │
         │  splitX(100, receiver)
         ▼
┌────────────────────────────────────────────────┐
│  FutarchyProposalPoc                            │
│                                                  │
│  1. Validate: amount > 0                         │
│  2. Validate: proposal is Unresolved             │
│  3. transferFrom: 100 tokenX from user → contract│
│  4. Mint: 100 yesX to receiver                   │
│  5. Mint: 100 noX  to receiver                   │
│  6. Emit SplitX(user, receiver, 100)             │
└────────────────────────────────────────────────┘

Result:
  User loses:    100 tokenX
  Receiver gets: 100 yesX + 100 noX
```

### splitUsdc Flow

```
User deposits 1000 USDC
         │
         │  splitUsdc(1000, receiver)
         ▼
┌────────────────────────────────────────────────┐
│  FutarchyProposalPoc                            │
│                                                  │
│  1. Validate: amount > 0                         │
│  2. Validate: proposal is Unresolved             │
│  3. transferFrom: 1000 USDC from user → contract │
│  4. Mint: 1000 yesUsdc to receiver               │
│  5. Mint: 1000 noUsdc  to receiver               │
│  6. Emit SplitUsdc(user, receiver, 1000)         │
└────────────────────────────────────────────────┘

Result:
  User loses:    1000 USDC
  Receiver gets: 1000 yesUsdc + 1000 noUsdc
```

### Key Insight: Conservation Law

Splitting is **value-neutral** — the total claims on the underlying asset are preserved:

```
100 tokenX = 100 yesX + 100 noX

Because:
  If YES wins → 100 yesX redeemable for 100 tokenX (noX becomes worthless)
  If NO wins  → 100 noX redeemable for 100 tokenX (yesX becomes worthless)

Either way, exactly 100 tokenX is distributed.
```

---

## 8. Phase 4: Trading Period

### Who: Any user (on Uniswap V3)

### How: External — trades happen directly on Uniswap V3 pools

After splitting, users hold both yes and no tokens. If they believe the proposal will pass, they can:

```
BULLISH on proposal (believes YES will win):
  1. Split tokenX → get yesX + noX
  2. Sell noX on the NO pool for noUsdc
  3. Or: buy more yesX on the YES pool using yesUsdc

BEARISH on proposal (believes NO will win):
  1. Split tokenX → get yesX + noX
  2. Sell yesX on the YES pool for yesUsdc
  3. Or: buy more noX on the NO pool using noUsdc
```

### How Trading Creates Price Signals

```
                   YES Pool                    NO Pool
               (yesX / yesUsdc)            (noX / noUsdc)
                     │                          │
  Buying yesX ◄──────┤                          ├──────► Buying noX
  (bullish)          │                          │        (bearish)
                     │                          │
              Price of yesX              Price of noX
              goes UP                    goes UP
                     │                          │
                     └──────────┬───────────────┘
                                │
                         TWAP Comparison
                                │
                    ┌───────────┴───────────┐
                    │                       │
              yesTwap > noTwap        noTwap > yesTwap
              ═══════════════         ═══════════════
              YES WINS                NO WINS
```

### Trading Pairs

| Pool | Token0 | Token1 | What it prices |
|---|---|---|---|
| YES Pool | yesX | yesUsdc | Price of tokenX in the "proposal passes" world |
| NO Pool | noX | noUsdc | Price of tokenX in the "proposal fails" world |

The markets are asking: "What will tokenX be worth if this proposal passes vs. if it fails?"

---

## 9. Phase 5: Token Merging

### Who: Any user holding matched pairs

### How: `mergeX()` or `mergeUsdc()`

Merging is the reverse of splitting — users return **equal amounts** of yes and no tokens to get back the underlying.

### mergeX Flow

```
User holds 100 yesX AND 100 noX
         │
         │  mergeX(100, receiver)
         ▼
┌────────────────────────────────────────────────┐
│  FutarchyProposalPoc                            │
│                                                  │
│  1. Validate: amount > 0                         │
│  2. Validate: proposal is Unresolved             │
│  3. Burn: 100 yesX from msg.sender               │
│  4. Burn: 100 noX  from msg.sender               │
│  5. Transfer: 100 tokenX to receiver             │
│  6. Emit MergeX(user, receiver, 100)             │
└────────────────────────────────────────────────┘

Result:
  User loses:    100 yesX + 100 noX
  Receiver gets: 100 tokenX
```

### Why Merge?

1. **Exit the market** — a user who no longer wants exposure can merge and leave
2. **Arbitrage** — if the combined price of yesX + noX diverges from tokenX, arbitrageurs can profit by splitting/merging
3. **Risk-free exit** — merging always gives back the exact underlying, regardless of market conditions

### Arbitrage Example

```
Suppose:
  tokenX market price    = $100
  yesX price on YES pool = $70
  noX price on NO pool   = $40

Combined conditional price = $70 + $40 = $110 > $100

Arbitrage:
  1. Buy 1 tokenX for $100 on the open market
  2. splitX(1) → get 1 yesX + 1 noX
  3. Sell yesX for $70 on YES pool
  4. Sell noX for $40 on NO pool
  5. Profit: $110 - $100 = $10

This arbitrage pushes prices back toward equilibrium.
```

---

## 10. Phase 6: Resolution

### Who: Anyone (permissionless)

### How: `resolve()`

### When: After `resolutionTimestamp` has passed

```
Anyone calls resolve()
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  VALIDATION                                                 │
│  1. outcome == Unresolved (not already resolved)            │
│  2. block.timestamp >= resolutionTimestamp                   │
│  3. Both AMMs are set (ammYesPair ≠ 0, ammNoPair ≠ 0)    │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  TWAP CALCULATION                                           │
│                                                              │
│  yesTwap = getTwap(ammYesPair)                               │
│  noTwap  = getTwap(ammNoPair)                                │
│                                                              │
│  Each TWAP is the average tick over the last twapWindow      │
│  seconds (see Section 13 for details)                        │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  OUTCOME DETERMINATION                                      │
│                                                              │
│  if yesTwap > noTwap:                                        │
│    outcome = Yes                                             │
│  else:                                                       │
│    outcome = No                                              │
│                                                              │
│  Emit Resolved(proposalId, outcome)                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
               YES WINS   NO WINS
                    │         │
                    ▼         │
┌───────────────────────┐     │
│  EXECUTION            │     │
│                       │     │
│  transferToken.       │     │
│    safeTransfer(      │     │
│      recipient,       │     │
│      transferAmount   │     │
│    )                  │     │
│                       │     │
│  Emit Executed(...)   │     │
└───────────────────────┘     │
                              │
                              ▼
                    No execution happens.
                    Funds stay in contract.
```

### Resolution Logic

The comparison `yesTwap > noTwap` determines the outcome:

- **YES wins** when the yes pool's average tick is higher → meaning yesX has been trading at a higher price relative to yesUsdc than noX has relative to noUsdc
- **NO wins** when noTwap ≥ yesTwap

**Tie-breaking**: If TWAPs are exactly equal, **NO wins** (the `>` comparison means equal defaults to No).

---

## 11. Phase 7: Redemption

### Who: Holders of winning conditional tokens

### How: `redeemWinningX()` or `redeemWinningUsdc()`

### When: Only after resolution

```
Winner holds 100 yesX (and YES won)
         │
         │  redeemWinningX(100, receiver)
         ▼
┌────────────────────────────────────────────────┐
│  FutarchyProposalPoc                            │
│                                                  │
│  1. Validate: amount > 0                         │
│  2. Validate: proposal IS resolved               │
│  3. Check outcome:                               │
│     ├── Yes → burn yesX from msg.sender          │
│     └── No  → burn noX from msg.sender           │
│  4. Transfer: 100 tokenX to receiver             │
│  5. Emit RedeemedX(user, receiver, Yes, 100)     │
└────────────────────────────────────────────────┘

Result:
  Winner loses:  100 yesX (burned)
  Receiver gets: 100 tokenX
```

### What Happens to Losing Tokens?

Losing tokens (e.g., noX when YES wins) become **worthless**. They can never be redeemed. The underlying tokens they represent are claimed by the winning side.

### Redemption Economics

```
Before resolution:
  Contract holds: 500 tokenX (from 500 splits)
  Outstanding:    500 yesX + 500 noX

After YES wins:
  500 yesX holders can redeem for 500 tokenX (1:1)
  500 noX are worthless

  The math always balances because:
  Total tokenX in contract = Total yesX outstanding = Total noX outstanding
```

---

## 12. Phase 8: Execution

### Automatic — happens during resolution

If the outcome is **Yes**, the `resolve()` function automatically transfers the pre-specified tokens:

```
transferToken.safeTransfer(recipient, transferAmount)
```

This is the **governance action** — the proposal's effect on the real world. Examples:

- Transfer 10,000 USDC to a development team
- Transfer 100 ETH to a treasury address
- Fund a specific initiative

If **No wins**, no transfer occurs — the proposal is rejected and the tokens stay in the contract.

---

## 13. TWAP Oracle Mechanism

### What is TWAP?

**T**ime-**W**eighted **A**verage **P**rice — the average price over a time window, weighted by how long the price stayed at each level. This makes it resistant to flash loan attacks and momentary price manipulation.

### How It Works

```solidity
function getTwap(IOracle pool) internal view returns (int56) {
    uint32[] memory secondsAgos = new uint32[](2);
    secondsAgos[0] = twapWindow;  // twapWindow seconds ago
    secondsAgos[1] = 0;           // now

    (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);
    return (tickCumulatives[1] - tickCumulatives[0]) / int56(int32(twapWindow));
}
```

### Step by Step

```
1. Query the Uniswap V3 oracle for tick cumulatives at:
   ├── t = now - twapWindow seconds
   └── t = now

2. tickCumulative is a running sum of ticks over time:
   tickCumulative(t) = Σ tick(i) × Δt(i) for all i from 0 to t

3. Average tick over the window:
   avgTick = (tickCumulative[now] - tickCumulative[twapWindow ago]) / twapWindow

4. The tick represents log₁.₀₀₀₁(price):
   price = 1.0001^tick

5. Higher tick = higher price
```

### Configurable TWAP Window

The TWAP window is configurable per proposal via the `twapWindow` parameter (set at creation, minimum 60 seconds). This allows short windows for testnet testing while maintaining security in production.

| Window | Manipulation Resistance | Price Freshness | Use Case |
|---|---|---|---|
| 1 minute | Very low | Extremely fresh | Testnet only |
| 5 minutes | Low | Very fresh | Testnet / quick demos |
| 1 hour (default) | **Good balance** | Reasonably fresh | **Production recommended** |
| 24 hours | Very high | May be stale | High-value proposals |

### Manipulation Cost

To manipulate a TWAP by X%, an attacker would need to:
1. Move the spot price by X%
2. Hold it there for the **entire `twapWindow` duration**
3. Pay trading fees on the capital required
4. Accept impermanent loss risk

The capital cost scales with both the manipulation size and the window duration. Longer windows require sustaining the manipulation longer, increasing cost. For production deployments, 1 hour (3600 seconds) is the recommended default.

---

## 14. Token Flow Diagrams

### Complete Token Flow: Happy Path (YES Wins)

```
         USER                           CONTRACT                     UNISWAP V3
          │                                │                              │
          │── splitX(100, self) ──────────►│                              │
          │   100 tokenX ────────────────►│                              │
          │◄── 100 yesX ─────────────────│                              │
          │◄── 100 noX ──────────────────│                              │
          │                                │                              │
          │── sell 100 noX on NO pool ───────────────────────────────────►│
          │◄── receive noUsdc ──────────────────────────────────────────│
          │                                │                              │
          │   ... time passes, YES TWAP > NO TWAP ...                     │
          │                                │                              │
          │── resolve() ─────────────────►│                              │
          │                                │── safeTransfer to recipient  │
          │                                │   (execution if YES wins)    │
          │                                │                              │
          │── redeemWinningX(100, self) ──►│                              │
          │   burn 100 yesX ──────────────►│                              │
          │◄── 100 tokenX ────────────────│                              │
          │                                │                              │
```

### Token Minting & Burning Summary

| Operation | Mints | Burns | Transfers |
|---|---|---|---|
| splitX | yesX, noX | — | tokenX: user → contract |
| splitUsdc | yesUsdc, noUsdc | — | USDC: user → contract |
| mergeX | — | yesX, noX | tokenX: contract → user |
| mergeUsdc | — | yesUsdc, noUsdc | USDC: contract → user |
| redeemWinningX | — | winning X token | tokenX: contract → user |
| redeemWinningUsdc | — | winning USDC token | USDC: contract → user |
| resolve (Yes) | — | — | transferToken: contract → recipient |

---

## 15. Access Control Model

```
┌───────────────────────────────────────────────────────┐
│                   ACCESS CONTROL                       │
├────────────────────────┬──────────────────────────────┤
│ Function               │ Who Can Call                  │
├────────────────────────┼──────────────────────────────┤
│ createProposal         │ Factory owner only            │
│ createProposalWithAmm  │ Factory owner only            │
│ createAndSetAmms       │ Proposal owner only           │
│ setupAmmWithLiquidity  │ Owner OR factory              │
│ splitX                 │ Anyone (with token approval)  │
│ splitUsdc              │ Anyone (with USDC approval)   │
│ mergeX                 │ Anyone (with yes+no balance)  │
│ mergeUsdc              │ Anyone (with yes+no balance)  │
│ resolve                │ Anyone (after timestamp)      │
│ redeemWinningX         │ Anyone (with winning tokens)  │
│ redeemWinningUsdc      │ Anyone (with winning tokens)  │
│ mint/burn (CT)         │ Manager contract only         │
├────────────────────────┼──────────────────────────────┤
│ MODIFIERS              │                              │
├────────────────────────┼──────────────────────────────┤
│ onlyOwner              │ Owner address                 │
│ onlyOwnerOrFactory     │ Owner OR factory address      │
│ onlyManager            │ FutarchyProposalPoc address   │
│ onlyUnresolved         │ outcome == Unresolved         │
│ onlyResolved           │ outcome != Unresolved         │
│ nonReentrant           │ ReentrancyGuard (OpenZeppelin)│
└────────────────────────┴──────────────────────────────┘
```

---

## 16. Error Handling

| Error | When Triggered | In Function |
|---|---|---|
| `NotManager()` | Non-manager tries to mint/burn conditional tokens | ConditionalToken.mint/burn |
| `AlreadyResolved()` | (Defined but used via `ProposalClosed` modifier) | — |
| `NotResolved()` | Trying to redeem before resolution | redeemWinningX/Usdc |
| `ZeroAmount()` | Split/merge/redeem with amount = 0, or insufficient AMM liquidity balance | split/merge/redeem, createAndSetAmms |
| `InvalidOutcome()` | Outcome is somehow not Yes or No during redemption | redeemWinningX/Usdc |
| `ProposalClosed()` | Trying to split/merge after resolution | splitX/Usdc, mergeX/Usdc |
| `ResolutionPeriodNotOver()` | Calling resolve() before resolutionTimestamp | resolve |
| `AmmsAlreadySet()` | Trying to set AMMs a second time | createAndSetAmms |
| `AmmsNotSet()` | Trying to resolve without AMMs configured | resolve |
| `UniswapV3PoolCreationFailed()` | Pool creation returns address(0) | createAndSetAmms |
| `UniswapV3LiquidityAdditionFailed()` | Liquidity mint returns 0 values | createAndSetAmms |
| `InvalidFeeTier()` | Fee tier has no tickSpacing configured | createAndSetAmms |
| `TransferFailed()` | (Defined, SafeERC20 handles this internally) | — |
| `TwapWindowTooShort()` | twapWindow_ constructor argument < 60 seconds | FutarchyProposalPoc constructor |
| `NotOwnerOrFactory()` | Caller is neither owner nor factory | setupAmmWithLiquidity |

---

## 17. Events Reference

| Event | Parameters | Emitted In |
|---|---|---|
| `SplitX` | caller (indexed), receiver (indexed), amount | splitX |
| `SplitUsdc` | caller (indexed), receiver (indexed), amount | splitUsdc |
| `MergeX` | caller (indexed), receiver (indexed), amount | mergeX |
| `MergeUsdc` | caller (indexed), receiver (indexed), amount | mergeUsdc |
| `Resolved` | proposalId (indexed), outcome | resolve |
| `RedeemedX` | caller (indexed), receiver (indexed), winningSide (indexed), amount | redeemWinningX |
| `RedeemedUsdc` | caller (indexed), receiver (indexed), winningSide (indexed), amount | redeemWinningUsdc |
| `AmmsSet` | ammYesPair, ammNoPair | createAndSetAmms, setupAmmWithLiquidity |
| `Executed` | proposalId (indexed), recipient (indexed), token, amount | resolve (Yes only) |
| `ProposalCreatedWithAmm` | proposalId (indexed), proposal (indexed), ammYesPair, ammNoPair | createProposalWithAmm (factory) |

---

## 18. Security Considerations

### Protections in Place

| Protection | Mechanism |
|---|---|
| Reentrancy | OpenZeppelin `ReentrancyGuard` on all split/merge/redeem functions |
| Safe transfers | `SafeERC20` used for all token transfers (reverts on failure) |
| Access control | `Ownable` for admin functions, `onlyManager` for token minting |
| State guards | `onlyUnresolved` / `onlyResolved` modifiers prevent invalid state transitions |
| Zero amount | Explicit checks prevent no-op operations |
| One-time AMM setup | `AmmsAlreadySet` error prevents re-initialization |
| Oracle manipulation | Configurable TWAP window (min 60s, default 1 hour) makes flash loan attacks impractical |
| Input validation | Constructor validates all addresses ≠ address(0) |

### Known Limitations (POC)

1. **No emergency pause** — once deployed, there's no way to pause the contract
2. **No timelock on AMM setup** — owner can set AMMs at any time
3. **Equal TWAP defaults to No** — tie-breaking favors the status quo
4. **No fee collection** — the protocol charges no fees on splits/merges
5. **Full-range liquidity only** — no concentrated liquidity strategies
6. **No governance upgrade path** — contracts are not upgradeable
7. **Liquidity removal** — no function to remove the initial LP position after resolution
