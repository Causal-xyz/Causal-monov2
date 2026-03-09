import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="gradient-text text-lg font-bold">Causal</span>
            <span className="text-sm text-muted-foreground">
              Futarchy-based prediction market
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/proposals" className="transition-colors hover:text-foreground">
              Proposals
            </Link>
            <Link
              href="https://docs.avax.network/avalanche-l1s/build-first-avalanche-l1"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Docs
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Built on Avalanche &middot; Powered by Uniswap V3 TWAP
        </div>
      </div>
    </footer>
  );
}
