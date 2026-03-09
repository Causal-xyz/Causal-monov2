# @causal/api — Fastify Backend

## Overview

Fastify 5 REST API server with TypeScript, built with tsup.

## Key Paths

```
src/
  index.ts          → Entry point (starts server)
  app.ts            → Fastify app factory (plugin/route registration)
  config/
    env.ts          → Environment configuration
  routes/
    health.ts       → GET /health endpoint
  plugins/
    cors.ts         → CORS plugin registration
```

## Conventions

- App factory pattern: `buildApp()` in `app.ts` creates the Fastify instance
- Routes are registered as Fastify plugins in `src/routes/`
- Plugins (cors, auth, etc.) go in `src/plugins/`
- Config/env validation in `src/config/`
- Import shared types from `@causal/shared`
- Use ESM (`"type": "module"`) — all local imports need `.js` extension

## Configuration

- `tsconfig.json` — extends `@causal/typescript-config/node.json`
- Build tool: `tsup` (outputs to `dist/`)
- Dev tool: `tsx watch` for hot reload

<!-- AUTO-GENERATED: commands -->
## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server with hot reload (port 3001) |
| `pnpm build` | Build with tsup |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint src/ |
| `pnpm typecheck` | TypeScript check |
<!-- /AUTO-GENERATED: commands -->

<!-- AUTO-GENERATED: env-vars -->
## Environment Variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `RPC_URL` | No | `https://api.avax-test.network/ext/bc/C/rpc` | Avalanche Fuji RPC for contract reads |
| `FACTORY_ADDRESS` | Yes | — | FutarchyFactoryPoc deployed address |
| `MOCK_TOKEN_X_ADDRESS` | Yes | — | MockTokenX deployed address |
| `MOCK_USDC_ADDRESS` | Yes | — | MockUSDC deployed address |
<!-- /AUTO-GENERATED: env-vars -->
