# Causal Trading — Monorepo

Fundraise-to-governance platform: raise USDC via time-weighted token sales, then govern with futarchy — where Uniswap V3 TWAP prices decide proposal outcomes.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui + wagmi/viem
- **Backend**: Fastify 5 + TypeScript
- **Smart Contracts**: Foundry (Solidity 0.8.24)
- **Blockchain**: Avalanche Fuji Testnet (chain ID 43113)
- **Package Manager**: pnpm 10.4
- **Node**: v24

## Project Structure

```
apps/
  web/          → Next.js frontend (port 3000)
    src/
      app/
        /                          → Landing page
        /fundraises                → List all fundraises
        /fundraises/create         → Create new fundraise
        /fundraises/[id]           → Fundraise detail (contribute, claim, finalize)
        /proposals                 → List all proposals
        /proposals/create          → Create proposal
        /proposals/[address]       → Proposal detail (split, merge, resolve, redeem)
      components/
        layout/     → Header, Footer
        fundraise/  → FundraiseProgress, FundraiseStatusBadge, ContributePanel, ClaimPanel, FinalizePanel
        proposal/   → ProposalHeader, SplitMergePanel, MarketOverview, PortfolioPanel, ResolutionPanel, RedemptionPanel
        ui/         → shadcn/ui components (Button, Card, Badge)
        ConnectWallet, StatusBadge, TransactionButton, TokenAmount, ThemeProvider
      hooks/
        Fundraise:  → useAllFundraises, useFundraiseInfo, useUserContribution, useCreateOrganization, useCommit, useFinalize, useFundraiseClaim
        Proposals:  → useProposalInfo, useConditionalBalances, useSplit, useMerge, useResolve, useRedeem, useApprovalFlow, useAllProposals, useCreateProposal, useTokenBalance, useCountdown
      lib/          → utils.ts, wagmi.ts
      providers.tsx → WagmiProvider + QueryClient + ThemeProvider
  api/          → Fastify backend (port 3001)
    src/
      app.ts        → Fastify app factory
      config/env.ts → Environment configuration
      routes/       → health.ts
      plugins/      → cors.ts
  contracts/    → Foundry smart contracts
    src/
      CausalOrganizations.sol → Singleton: fundraise creation, commit, finalize, claim
      OrgToken.sol            → ERC20 governance token with controlled minting
      Treasury.sol            → Per-org treasury holding USDC, authorizes proposals
      futarchy.sol            → ConditionalToken, FutarchyProposalPoc, FutarchyFactoryPoc
      MockTokenX.sol          → Test ERC20 (CTK, 18 decimals, public mint + faucet)
      MockUSDC.sol            → Test USDC (mUSDC, 6 decimals, public mint + faucet)
    script/
      Deploy.s.sol            → Deploys MockTokenX, MockUSDC, CausalOrganizations
    test/
      CausalOrganizations.t.sol → 23 tests (create, commit, finalize, claim, lifecycle)
      Futarchy.t.sol            → 5 tests (proposal, resolve yes/no, edge cases)
packages/
  shared/             → Types, constants, ABIs
    src/
      types.ts        → Proposal, Outcome, Organization, OrgInfo, OrgSale, UserContribution, etc.
      constants.ts    → Chain config, contract addresses (from env vars), fee tiers
      abi/            → causalOrganizations, treasury, orgToken, futarchyFactory, futarchyProposal, erc20
  typescript-config/  → Shared tsconfig bases (base, nextjs, node)
  eslint-config/      → Shared ESLint config
docs/                 → Project documentation
```

<!-- AUTO-GENERATED: commands -->
## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web + api concurrently |
| `pnpm dev:web` | Start frontend only (port 3000) |
| `pnpm dev:back` | Start backend only (port 3001) |
| `pnpm build` | Build all apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all apps |
| `pnpm typecheck` | TypeScript check all apps |
| `pnpm format` | Format with Prettier |
<!-- /AUTO-GENERATED: commands -->

<!-- AUTO-GENERATED: env-vars -->
## Environment Variables

Each app has a `.env.example` — copy to `.env.local` (web/api) or `.env` (contracts).

### apps/web

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_RPC_URL` | No | `https://api.avax-test.network/ext/bc/C/rpc` | Avalanche Fuji RPC endpoint |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Yes | — | FutarchyFactoryPoc deployed address |
| `NEXT_PUBLIC_MOCK_TOKEN_X_ADDRESS` | Yes | — | MockTokenX deployed address |
| `NEXT_PUBLIC_MOCK_USDC_ADDRESS` | Yes | — | MockUSDC deployed address |
| `NEXT_PUBLIC_UNISWAP_V3_FACTORY` | Yes | — | Uniswap V3 Factory address on Fuji |
| `NEXT_PUBLIC_POSITION_MANAGER` | Yes | — | Uniswap V3 NonfungiblePositionManager |
| `NEXT_PUBLIC_SWAP_ROUTER` | Yes | — | Uniswap V3 SwapRouter address |
| `NEXT_PUBLIC_CAUSAL_ORGANIZATIONS_ADDRESS` | Yes | — | CausalOrganizations deployed address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No | — | WalletConnect project ID (optional) |

### apps/api

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `RPC_URL` | No | `https://api.avax-test.network/ext/bc/C/rpc` | Avalanche Fuji RPC endpoint |
| `FACTORY_ADDRESS` | Yes | — | FutarchyFactoryPoc deployed address |
| `MOCK_TOKEN_X_ADDRESS` | Yes | — | MockTokenX deployed address |
| `MOCK_USDC_ADDRESS` | Yes | — | MockUSDC deployed address |

### apps/contracts

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVATE_KEY` | Yes | — | Deployer private key (no 0x prefix) |
| `RPC_URL` | No | `https://api.avax-test.network/ext/bc/C/rpc` | Avalanche Fuji RPC |
| `SNOWTRACE_API_KEY` | No | — | For contract verification on Snowtrace |
| `ETHERSCAN_API_KEY` | No | — | Alias for Snowtrace verification |
<!-- /AUTO-GENERATED: env-vars -->

## Smart Contract Deployment

```sh
cd apps/contracts
forge script script/Deploy.s.sol --rpc-url https://api.avax-test.network/ext/bc/C/rpc --broadcast
```

After deployment, set the contract addresses in each app's `.env.local`.

## Web3 Architecture

- **wagmi** — React hooks for Ethereum (wallet connection, contract reads/writes)
- **viem** — TypeScript Ethereum client (parsing, formatting, types)
- **@tanstack/react-query** — Caching and state management for contract data
- ABIs live in `packages/shared/src/abi/` as typed `as const` arrays
- Contract addresses are read from `NEXT_PUBLIC_*` env vars via `packages/shared/src/constants.ts`
- All hooks in `apps/web/src/hooks/` wrap wagmi for specific contract interactions

## UI Theme

- Dark theme by default with green accent (#4EDB72)
- Glass morphism effects (.glass, .glass-card)
- Gradient text (.gradient-text) and glow buttons (.btn-glow)
- Theme toggle (dark/light) via ThemeProvider context
- Animated background with drift animation

## Conventions

- Workspace packages are scoped under `@causal/*`
- Shared types go in `packages/shared/src/`
- Contract ABIs go in `packages/shared/src/abi/`
- Environment variables use `.env.local` per app (never committed)
- Immutable data patterns — never mutate objects, return new copies
- Small files (200-400 lines), small functions (<50 lines)

## Documentation

- [Futarchy Protocol Flow (markdown)](docs/futarchy-flow.md) — complete lifecycle, token flows, TWAP oracle, access control, errors/events
- [Futarchy Protocol Flow (visual)](docs/futarchy-flow.html) — interactive HTML page with diagrams, open in browser

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Branch from `master`

## Adding shadcn/ui Components

```sh
cd apps/web && pnpm dlx shadcn@latest add <component>
```

## Uniswap V3 on Avalanche

### Mainnet (C-Chain 43114) — Official deployment

| Contract | Address |
|----------|---------|
| UniswapV3Factory | `0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD` |
| SwapRouter02 | `0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE` |
| NonfungiblePositionManager | `0x655C406EBFa14EE2006250925e54ec43AD184f8B` |
| QuoterV2 | `0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F` |
| UniversalRouter | `0x94b75331ae8d42c1b61065089b7d48fe14aa73b7` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| WAVAX | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |

### Fuji Testnet (43113) — No official deployment

Uniswap V3 is **not** on Fuji. Self-deploy with `npx @uniswap/deploy-v3` (GPL-2.0 since April 2023). See README.md for full instructions.
