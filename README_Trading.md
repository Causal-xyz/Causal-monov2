<<<<<<< HEAD
# Causal-monov2
Building decision execution infrastructure for the on-chain economy. Markets should allocate capital to execution, not narratives.
=======
# Causal Trading

Futarchy-based prediction market where proposal outcomes are determined by Uniswap V3 TWAP prices on Avalanche.

> "Vote on values, bet on beliefs." — Robin Hanson

## How It Works

1. **Create Proposal** — Define a governance action with a resolution deadline
2. **Split Tokens** — Split base tokens (TokenX, USDC) into YES/NO conditional pairs
3. **Trade** — Buy/sell conditional tokens on Uniswap V3 pools
4. **Resolve** — 1-hour TWAP oracle compares YES vs NO market prices
5. **Redeem** — Winners burn conditional tokens to claim the underlying asset

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui + wagmi/viem |
| Backend | Fastify 5 + TypeScript |
| Smart Contracts | Foundry (Solidity 0.8.24) |
| Blockchain | Avalanche (Fuji Testnet / C-Chain Mainnet) |
| DEX | Uniswap V3 (TWAP oracle for resolution) |

## Getting Started

### Prerequisites

- Node.js v24+
- pnpm 10.4+
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)

### Install

```sh
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local` (web/api) or `.env` (contracts) in each app:

```sh
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/contracts/.env.example apps/contracts/.env
```

Fill in the contract addresses after deployment (see [Deployment](#deployment)).

### Development

```sh
pnpm dev          # Start web (port 3000) + api (port 3001)
pnpm dev:web      # Frontend only
pnpm dev:back     # Backend only
pnpm build        # Build all
pnpm typecheck    # TypeScript check
pnpm lint         # Lint all
pnpm test         # Run all tests
pnpm format       # Format with Prettier
```

## Deployment

### Smart Contracts

```sh
cd apps/contracts

# Deploy MockTokenX, MockUSDC, and FutarchyFactoryPoc to Fuji
forge script script/Deploy.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast
```

After deployment, update the `NEXT_PUBLIC_*` addresses in `apps/web/.env.local`.

### Uniswap V3 on Fuji

Uniswap V3 is **not officially deployed** on Avalanche Fuji testnet. You need to self-deploy using the Uniswap deploy CLI:

```sh
npx @uniswap/deploy-v3 \
  --private-key <DEPLOYER_PK> \
  --json-rpc https://api.avax-test.network/ext/bc/C/rpc \
  --weth9-address <WAVAX_ON_FUJI> \
  --native-currency-label AVAX \
  --owner-address <YOUR_ADDRESS> \
  --confirmations 1
```

This deploys the full V3 stack (~14 transactions, ~35M gas). Progress is saved in `state.json` and can be resumed if interrupted. After deployment, update the Uniswap addresses in your `.env.local`.

## Uniswap V3 — Avalanche Addresses

### Mainnet (C-Chain — Chain ID 43114)

Official governance-approved deployment. Source: [Uniswap Docs](https://docs.uniswap.org/contracts/v3/reference/deployments/avax-deployments)

| Contract | Address |
|----------|---------|
| UniswapV3Factory | `0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD` |
| SwapRouter02 | `0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE` |
| NonfungiblePositionManager | `0x655C406EBFa14EE2006250925e54ec43AD184f8B` |
| QuoterV2 | `0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F` |
| UniversalRouter | `0x94b75331ae8d42c1b61065089b7d48fe14aa73b7` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Multicall | `0x0139141Cd4Ee88dF3Cdb65881D411bAE271Ef0C2` |
| TickLens | `0xEB9fFC8bf81b4fFd11fb6A63a6B0f098c6e21950` |
| NFTDescriptor | `0x27Dd7eE7fE723e83Bf3612a75a034951fe299E99` |
| NonfungibleTokenPositionDescriptor | `0xe89B7C295d73FCCe88eF263F86e7310925DaEBAF` |
| TransparentUpgradeableProxy | `0xE1f93a7cB6fFa2dB4F9d5A2FD43158A428993C09` |
| V3Migrator | `0x44f5f1f5E452ea8d29C890E8F6e893fC0f1f0f97` |
| v3Staker | `0xCA9D0668C600c4dd07ca54Be1615FE5CDFd76Ac3` |
| WAVAX | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |

### Fuji Testnet (Chain ID 43113)

**No official Uniswap V3 deployment exists on Fuji.** The official Uniswap docs only list mainnet deployments. Uniswap's supported testnets are limited to Sepolia and Unichain Sepolia.

To use Uniswap V3 on Fuji, self-deploy using [`@uniswap/deploy-v3`](https://github.com/Uniswap/deploy-v3) (see [Deployment](#uniswap-v3-on-fuji) above). The V3 contracts are now GPL-2.0 licensed (BUSL expired April 2023), so self-deployment is fully permitted.

## Project Structure

```
apps/
  web/          → Next.js frontend (port 3000)
  api/          → Fastify backend  (port 3001)
  contracts/    → Foundry smart contracts
packages/
  shared/       → Types, constants, ABIs
  typescript-config/
  eslint-config/
docs/
  futarchy-flow.md    → Detailed protocol documentation
  futarchy-flow.html  → Interactive visual diagram
```

## Documentation

- [Futarchy Protocol Flow (markdown)](docs/futarchy-flow.md) — complete lifecycle, token flows, TWAP oracle, access control, errors/events
- [Futarchy Protocol Flow (visual)](docs/futarchy-flow.html) — interactive HTML diagram, open in browser

## License

MIT
>>>>>>> 6f6c95c (docs: add README with Uniswap V3 Avalanche deployment addresses)
