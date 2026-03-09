# Causal Trading — Monorepo

Futarchy-based prediction market where proposal outcomes are determined by Uniswap V3 TWAP prices.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui
- **Backend**: Fastify 5 + TypeScript
- **Smart Contracts**: Foundry (Solidity 0.8.24)
- **Package Manager**: pnpm 10.4
- **Node**: v24

## Project Structure

```
apps/
  web/          → Next.js frontend (port 3000)
  api/          → Fastify backend (port 3001)
  contracts/    → Foundry smart contracts
packages/
  shared/             → Shared types, constants, ABIs
  typescript-config/  → Shared tsconfig bases
  eslint-config/      → Shared ESLint config
docs/                 → Project documentation
  futarchy-flow.md    → Detailed futarchy protocol docs (markdown)
  futarchy-flow.html  → Interactive visual flow diagram (open in browser)
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web + api concurrently |
| `pnpm build` | Build all apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all apps |
| `pnpm typecheck` | TypeScript check |

## Conventions

- Workspace packages are scoped under `@causal/*`
- Shared types go in `packages/shared/src/`
- Contract ABIs (when generated) go in `packages/shared/src/abi/`
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
