"use client";

import { formatUnits } from "viem";

interface TokenAmountProps {
  readonly amount: bigint;
  readonly decimals?: number;
  readonly symbol?: string;
  readonly className?: string;
}

export function TokenAmount({
  amount,
  decimals = 18,
  symbol,
  className,
}: TokenAmountProps) {
  const formatted = formatUnits(amount, decimals);
  const display = parseFloat(formatted).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });

  return (
    <span className={className}>
      {display}
      {symbol ? ` ${symbol}` : ""}
    </span>
  );
}
