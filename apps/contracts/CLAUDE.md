# @causal/contracts — Foundry Smart Contracts

## Overview

Futarchy POC — a prediction market where proposal outcomes are determined by the relative market prices of conditional tokens traded on Uniswap V3.

## Key Paths

```
src/
  futarchy.sol      → Core contracts (ConditionalToken, FutarchyProposalPoc, FutarchyFactoryPoc)
  MockTokenX.sol    → Test ERC20 governance token (CTK, 18 decimals, public mint + faucet)
  MockUSDC.sol      → Test stablecoin (mUSDC, 6 decimals, public mint + faucet)
test/
  Futarchy.t.sol    → Test suite with mock contracts
script/
  Deploy.s.sol      → Deployment script for Avalanche Fuji
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
- Maintains on-chain proposal registry (`proposals[id]`)

### MockTokenX
- Simple ERC20 with public `mint()` and `faucet()` (10,000 CTK per call)
- 18 decimals

### MockUSDC
- Simple ERC20 with public `mint()` and `faucet()` (10,000 mUSDC per call)
- 6 decimals (matches real USDC)

## Dependencies

- OpenZeppelin v5.6.1 (ERC20, Ownable, ReentrancyGuard, SafeERC20)
- Uniswap V3 Core v1.0.0 (pools, oracle)
- Uniswap V3 Periphery v1.3.0 (position manager, liquidity)

## Remappings

```
@openzeppelin/contracts/ → lib/openzeppelin-contracts/contracts/
@uniswap/v3-core/       → lib/v3-core/
@uniswap/v3-periphery/  → lib/v3-periphery/
```

<!-- AUTO-GENERATED: commands -->
## Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | `forge build` |
| `pnpm test` | `forge test -vvv` |
| `pnpm lint` | `forge fmt --check` |
| `pnpm format` | `forge fmt` |
<!-- /AUTO-GENERATED: commands -->

## Deployment

```sh
# Set env vars (or use .env file)
export PRIVATE_KEY=<deployer-private-key>

# Deploy to Avalanche Fuji
forge script script/Deploy.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast

# Verify on Snowtrace (optional)
forge verify-contract <address> src/MockTokenX.sol:MockTokenX \
  --chain-id 43113 \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

<!-- AUTO-GENERATED: env-vars -->
## Environment Variables

Copy `.env.example` to `.env`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVATE_KEY` | Yes | — | Deployer private key (no 0x prefix) |
| `RPC_URL` | No | `https://api.avax-test.network/ext/bc/C/rpc` | Avalanche Fuji RPC endpoint |
| `SNOWTRACE_API_KEY` | No | — | API key for contract verification |
| `ETHERSCAN_API_KEY` | No | — | Alias for Snowtrace verification |
<!-- /AUTO-GENERATED: env-vars -->

## Solidity Version

`^0.8.24` with `via_ir = true` enabled in foundry.toml.
