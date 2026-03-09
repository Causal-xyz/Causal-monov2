# @causal/web — Next.js Frontend

## Overview

Next.js 15 app with App Router, Tailwind CSS v4, shadcn/ui (base-nova style), wagmi/viem for Web3, and @tanstack/react-query for state management.

## Key Paths

```
src/
  app/
    globals.css              → Tailwind + Causal dark theme + glass morphism
    layout.tsx               → Root layout (Inter font, Providers, Header/Footer)
    page.tsx                 → Landing page (hero, value props, how it works)
    fundraises/
      page.tsx               → Fundraise list with filters (all/active/finalized/failed)
      create/page.tsx        → Create fundraise form (name, symbol, token economics, alpha)
      [id]/page.tsx          → Fundraise detail (progress, contribute, claim, finalize, infra)
    proposals/
      page.tsx               → Proposal list with filters
      create/page.tsx        → Create proposal form
      [address]/page.tsx     → Proposal detail (split, merge, resolve, redeem)
  components/
    layout/
      Header.tsx             → Sticky nav with logo, links, theme toggle, wallet connect
      Footer.tsx             → Branded footer
    fundraise/
      FundraiseProgress.tsx  → Progress bar (raised vs goal)
      FundraiseStatusBadge.tsx → Status indicator (Funding/Finalized/Failed)
      ContributePanel.tsx    → USDC contribution form with approval flow
      ClaimPanel.tsx         → Claim tokens + refund after finalization
      FinalizePanel.tsx      → Founder controls (finalize raise / force finalize)
    proposal/
      ProposalHeader.tsx     → Title, status badge, countdown, Snowtrace link
      SplitMergePanel.tsx    → Split/merge tokens with approval flow
      MarketOverview.tsx     → YES/NO pool addresses and market info
      PortfolioPanel.tsx     → User's conditional token balances
      ResolutionPanel.tsx    → Resolve button (permissionless, after deadline)
      RedemptionPanel.tsx    → Redeem winning tokens post-resolution
    ui/                      → shadcn/ui components (Button, Card, Badge)
    ConnectWallet.tsx        → Wallet connect/disconnect button
    StatusBadge.tsx          → Outcome status indicator
    TransactionButton.tsx    → Button with tx lifecycle states
    TokenAmount.tsx          → Formatted token amount display
    ThemeProvider.tsx         → Dark/light mode context
  hooks/
    useAllFundraises.ts      → Fetch all orgs from CausalOrganizations (batch read)
    useFundraiseInfo.ts      → Single org info + sale + deployed contracts
    useUserContribution.ts   → User's committed, accumulator, claimed, allocation
    useCreateOrganization.ts → Create organization via CausalOrganizations
    useCommit.ts             → Commit USDC to a fundraise
    useFinalize.ts           → finalizeRaise / forceFinalize
    useFundraiseClaim.ts     → Claim tokens after finalization
    useProposalInfo.ts       → Read proposal details from contract
    useConditionalBalances.ts → Read all 4 conditional token balances
    useTokenBalance.ts       → Generic ERC20 balance + symbol + decimals
    useApprovalFlow.ts       → Check allowance → approve → callback
    useSplit.ts              → splitX / splitUsdc transaction hooks
    useMerge.ts              → mergeX / mergeUsdc transaction hooks
    useResolve.ts            → resolve() transaction hook
    useRedeem.ts             → redeemWinningX / redeemWinningUsdc hooks
    useAllProposals.ts       → Fetch all proposals from factory
    useCreateProposal.ts     → Create proposal via factory
    useCountdown.ts          → Live countdown timer
  lib/
    utils.ts                 → cn() helper (clsx + tailwind-merge)
    wagmi.ts                 → Wagmi config (Avalanche Fuji, injected connector)
  providers.tsx              → WagmiProvider + QueryClientProvider + ThemeProvider
public/                      → Static assets
```

## Configuration

- `components.json` — shadcn/ui config (base-nova style, lucide icons)
- `postcss.config.mjs` — PostCSS with @tailwindcss/postcss
- `next.config.ts` — transpiles `@causal/shared`
- `tsconfig.json` — extends `@causal/typescript-config/nextjs.json` (target ES2020)

## Conventions

- Use `@/` path alias for imports (maps to `src/`)
- Use `cn()` from `@/lib/utils` for conditional classNames
- Import shared types/ABIs from `@causal/shared`
- Server Components by default; add `"use client"` only when needed
- shadcn/ui components live in `src/components/ui/` — do not modify generated files directly
- All contract interactions go through custom hooks in `src/hooks/`
- Glass morphism classes: `.glass`, `.glass-card`, `.gradient-text`, `.btn-glow`

<!-- AUTO-GENERATED: commands -->
## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | Next.js lint |
| `pnpm typecheck` | TypeScript check |
<!-- /AUTO-GENERATED: commands -->

<!-- AUTO-GENERATED: env-vars -->
## Environment Variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_RPC_URL` | No | `https://api.avax-test.network/ext/bc/C/rpc` | Avalanche Fuji RPC endpoint |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Yes | — | FutarchyFactoryPoc deployed address |
| `NEXT_PUBLIC_MOCK_TOKEN_X_ADDRESS` | Yes | — | MockTokenX deployed address |
| `NEXT_PUBLIC_MOCK_USDC_ADDRESS` | Yes | — | MockUSDC deployed address |
| `NEXT_PUBLIC_UNISWAP_V3_FACTORY` | Yes | — | Uniswap V3 Factory on Fuji |
| `NEXT_PUBLIC_POSITION_MANAGER` | Yes | — | Uniswap V3 NonfungiblePositionManager |
| `NEXT_PUBLIC_SWAP_ROUTER` | Yes | — | Uniswap V3 SwapRouter |
| `NEXT_PUBLIC_CAUSAL_ORGANIZATIONS_ADDRESS` | Yes | — | CausalOrganizations deployed address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No | — | WalletConnect project ID |
<!-- /AUTO-GENERATED: env-vars -->

## Adding Components

```sh
pnpm dlx shadcn@latest add <component>
```
