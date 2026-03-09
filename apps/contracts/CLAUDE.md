# @causal/contracts — Foundry Smart Contracts

## Overview

Fundraise-to-governance platform: CausalOrganizations manages time-weighted token sales; on successful fundraise, it auto-deploys OrgToken + Treasury + FutarchyFactory. Futarchy proposals use Uniswap V3 TWAP to decide outcomes.

## Key Paths

```
src/
  CausalOrganizations.sol → Singleton: create org, commit USDC, finalize, claim tokens
  OrgToken.sol            → ERC20 governance token with controlled minting (minter role)
  Treasury.sol            → Per-org treasury: holds USDC, authorizes proposals, spendFunds/mintTokens
  futarchy.sol            → ConditionalToken, FutarchyProposalPoc, FutarchyFactoryPoc
  MockTokenX.sol          → Test ERC20 governance token (CTK, 18 decimals, public mint + faucet)
  MockUSDC.sol            → Test stablecoin (mUSDC, 6 decimals, public mint + faucet)
test/
  CausalOrganizations.t.sol → 23 tests (org creation, commit, finalize, claim, full lifecycle)
  Futarchy.t.sol            → 5 tests (proposal, resolve yes/no, edge cases)
script/
  Deploy.s.sol              → Deploys MockTokenX, MockUSDC, CausalOrganizations
lib/                        → Dependencies (forge-std, OpenZeppelin, Uniswap V3)
```

## Contracts

### CausalOrganizations (singleton)
- `createOrganization()` — creates a fundraise with name, symbol, description, token economics, sale duration, alpha
- `commit()` — investors send USDC with time-weighted accumulator
- `finalizeRaise()` — founder finalizes, auto-deploys OrgToken + Treasury + FutarchyFactoryPoc
- `forceFinalize()` — force-fail if goal not reached after sale ends
- `claim()` — investors redeem tokens + refund based on `alpha × (acc/totalAcc) + (1-alpha) × (committed/totalCommitted)`

### OrgToken
- ERC20 with `minter` role (initially CausalOrganizations, then transferred to Treasury)
- `mint()`, `lockMinting()`, `transferMinter()` — all onlyMinter

### Treasury
- Per-org treasury holding raised USDC
- `initialize()` — one-time setup with projectToken + proposalFactory
- `authorizeProposal()` — called by factory when creating proposals
- `spendFunds()` / `mintTokens()` — called by authorized proposals on YES outcome

### ConditionalToken
- ERC20 extension for conditional outcome tokens
- Manager-gated minting/burning

### FutarchyProposalPoc
- Creates 4 conditional tokens: yesX, noX, yesUsdc, noUsdc
- `splitX()` / `splitUsdc()` — split base tokens into yes/no pairs
- `mergeX()` / `mergeUsdc()` — merge pairs back to base
- `createAndSetAmms()` — creates Uniswap V3 pools with full-range liquidity
- `resolve()` — resolves via 1-hour TWAP; on YES, calls `treasury.spendFunds()` / `treasury.mintTokens()`
- Supports both treasury mode and standalone mode (`address(0)` treasury)

### FutarchyFactoryPoc
- Factory for creating proposals (Ownable)
- Auto-calls `treasury.authorizeProposal()` on creation
- Maintains on-chain proposal registry (`proposals[id]`)

### MockTokenX / MockUSDC
- Test tokens with public `mint()` and `faucet()` (10,000 per call)

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
