# @causal/contracts — Foundry Smart Contracts

## Overview

Futarchy POC — a prediction market where proposal outcomes are determined by the relative market prices of conditional tokens traded on Uniswap V3.

## Key Paths

```
src/
  futarchy.sol      → All contracts (ConditionalToken, FutarchyProposalPoc, FutarchyFactoryPoc)
test/
  Futarchy.t.sol    → Test suite (5 tests with mock contracts)
script/             → Deployment scripts (empty, to be added)
lib/                → Dependencies (forge-std, OpenZeppelin, Uniswap V3)
```

## Contracts

### ConditionalToken
- ERC20 extension for conditional outcome tokens
- Manager-gated minting/burning

### FutarchyProposalPoc (main contract)
- Creates 4 conditional tokens: yesX, noX, yesUsdc, noUsdc
- `splitX()` / `splitUsdc()` — split base tokens into yes/no pairs
- `mergeX()` / `mergeUsdc()` — merge pairs back to base
- `createAndSetAmms()` — creates Uniswap V3 pools with full-range liquidity
- `resolve()` — resolves proposal using 1-hour TWAP comparison
- `redeemWinningX()` / `redeemWinningUsdc()` — winners claim underlying

### FutarchyFactoryPoc
- Factory for creating proposals (Ownable)
- Maintains on-chain proposal registry

## Dependencies

- OpenZeppelin v5.6.1 (ERC20, Ownable, ReentrancyGuard)
- Uniswap V3 Core v1.0.0 (pools, oracle)
- Uniswap V3 Periphery v1.3.0 (position manager, liquidity)

## Remappings

```
@openzeppelin/contracts/ → lib/openzeppelin-contracts/contracts/
@uniswap/v3-core/       → lib/v3-core/
@uniswap/v3-periphery/  → lib/v3-periphery/
```

## Commands

```sh
pnpm build      # forge build
pnpm test       # forge test -vvv
pnpm lint       # forge fmt --check
pnpm format     # forge fmt
```

## Solidity Version

`^0.8.24` with `via_ir = true` enabled in foundry.toml.
