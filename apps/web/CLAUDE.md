# @causal/web — Next.js Frontend

## Overview

Next.js 15 app with App Router, Tailwind CSS v4, and shadcn/ui (base-nova style).

## Key Paths

```
src/
  app/              → Pages and layouts (App Router)
    globals.css     → Tailwind + shadcn theme variables
    layout.tsx      → Root layout (Geist font)
    page.tsx        → Home page
  components/
    ui/             → shadcn/ui components (Button, Card, Badge)
  lib/
    utils.ts        → cn() helper for className merging
  hooks/            → Custom React hooks (create as needed)
public/             → Static assets
```

## Configuration

- `components.json` — shadcn/ui config (base-nova style, lucide icons)
- `postcss.config.mjs` — PostCSS with @tailwindcss/postcss
- `next.config.ts` — transpiles `@causal/shared`
- `tsconfig.json` — extends `@causal/typescript-config/nextjs.json`

## Conventions

- Use `@/` path alias for imports (maps to `src/`)
- Use `cn()` from `@/lib/utils` for conditional classNames
- Import shared types from `@causal/shared`
- Server Components by default; add `"use client"` only when needed
- shadcn/ui components live in `src/components/ui/` — do not modify generated files directly

## Commands

```sh
pnpm dev        # Start dev server with Turbopack (port 3000)
pnpm build      # Production build
pnpm lint       # Next.js lint
pnpm typecheck  # TypeScript check
```

## Adding Components

```sh
pnpm dlx shadcn@latest add <component>
```
