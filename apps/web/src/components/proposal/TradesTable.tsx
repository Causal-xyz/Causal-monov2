"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { avalancheFuji } from "viem/chains";
import { useBlockNumber } from "wagmi";

const SWAP_EVENT = parseAbiItem(
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"
);

interface Trade {
  txHash: string;
  blockNumber: bigint;
  timestamp: number;
  market: "YES" | "NO";
  type: "Buy" | "Sell";
  price: number;
  size: number; // USDC amount (6 decimals)
  pool: `0x${string}`;
}

interface PoolMeta {
  address: `0x${string}`;
  market: "YES" | "NO";
  token0IsUsdc: boolean; // true if token0 == USDC
}

interface TradesTableProps {
  readonly ammYesPair: `0x${string}`;
  readonly ammNoPair: `0x${string}`;
  readonly yesX: `0x${string}` | undefined;
  readonly noX: `0x${string}` | undefined;
  readonly usdc: `0x${string}`;
  readonly isResolved?: boolean;
}

const client = createPublicClient({
  chain: avalancheFuji,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc"),
});

function sqrtPriceToPrice(sqrtPriceX96: bigint, token0IsUsdc: boolean): number {
  // price = (sqrtPriceX96 / 2^96)^2, adjusted for decimals (USDC=6, conditional=18)
  const Q96 = 2n ** 96n;
  const ratio = Number(sqrtPriceX96) / Number(Q96);
  const rawPrice = ratio * ratio;
  // If token0 is USDC (6 dec) and token1 is conditional (18 dec):
  // price of conditional in USDC = rawPrice * 10^(18-6) = rawPrice * 10^12
  // If token0 is conditional and token1 is USDC:
  // price of conditional in USDC = (1/rawPrice) / 10^12
  if (token0IsUsdc) {
    return rawPrice * 1e12;
  } else {
    return rawPrice === 0 ? 0 : 1 / (rawPrice * 1e12);
  }
}

export function TradesTable({ ammYesPair, ammNoPair, yesX, noX, usdc, isResolved }: TradesTableProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!yesX || !noX) return;

    const usdcLower = usdc.toLowerCase();

    async function fetchPoolMeta(address: `0x${string}`): Promise<PoolMeta | null> {
      try {
        const [t0, t1] = await Promise.all([
          client.readContract({ address, abi: [parseAbiItem("function token0() view returns (address)")], functionName: "token0" }),
          client.readContract({ address, abi: [parseAbiItem("function token1() view returns (address)")], functionName: "token1" }),
        ]);
        const market: "YES" | "NO" = address.toLowerCase() === ammYesPair.toLowerCase() ? "YES" : "NO";
        return { address, market, token0IsUsdc: (t0 as string).toLowerCase() === usdcLower };
      } catch {
        return null;
      }
    }

    setLoading(true);
    try {
      const [yesMeta, noMeta] = await Promise.all([
        fetchPoolMeta(ammYesPair),
        fetchPoolMeta(ammNoPair),
      ]);

        const pools = [yesMeta, noMeta].filter(Boolean) as PoolMeta[];
        const latest = await client.getBlockNumber();
        const fromBlock = latest > 2000n ? latest - 2000n : 0n;

        const allLogs = await Promise.all(
          pools.map((pool) =>
            client.getLogs({
              address: pool.address,
              event: SWAP_EVENT,
              fromBlock,
              toBlock: latest,
            }).then((logs) => logs.map((l) => ({ ...l, meta: pool })))
          )
        );

        const flat = allLogs.flat().sort((a, b) =>
          Number(b.blockNumber) - Number(a.blockNumber)
        );

        // Batch fetch block timestamps
        const blockNums = [...new Set(flat.map((l) => l.blockNumber))];
        const blockTimes = new Map<bigint, number>();
        await Promise.all(
          blockNums.map(async (bn) => {
            const blk = await client.getBlock({ blockNumber: bn });
            blockTimes.set(bn, Number(blk.timestamp));
          })
        );

        const result: Trade[] = flat.slice(0, 100).map((log) => {
          const { amount0, amount1, sqrtPriceX96 } = log.args as {
            amount0: bigint;
            amount1: bigint;
            sqrtPriceX96: bigint;
          };

          const price = sqrtPriceToPrice(sqrtPriceX96, log.meta.token0IsUsdc);

          // Determine buy/sell from the trader's perspective:
          // Buying conditional = USDC going in (negative USDC amount from pool's view)
          // token0 is USDC → amount0 < 0 means USDC left pool = user received USDC = Sell conditional
          // token0 is USDC → amount0 > 0 means USDC entered pool = user paid USDC = Buy conditional
          let isBuy: boolean;
          if (log.meta.token0IsUsdc) {
            isBuy = amount0 > 0n; // USDC flowed in
          } else {
            isBuy = amount1 > 0n; // USDC flowed in (token1 is USDC)
          }

          // Size = USDC amount involved
          const usdcAmt = log.meta.token0IsUsdc ? amount0 : amount1;
          const size = Math.abs(Number(formatUnits(usdcAmt < 0n ? -usdcAmt : usdcAmt, 6)));

          return {
            txHash: log.transactionHash ?? "",
            blockNumber: log.blockNumber,
            timestamp: blockTimes.get(log.blockNumber) ?? 0,
            market: log.meta.market,
            type: isBuy ? "Buy" : "Sell",
            price,
            size,
            pool: log.meta.address,
          };
        });

        setTrades(result);
      } catch (e) {
        console.error("Failed to fetch trades", e);
      } finally {
        setLoading(false);
      }
  }, [ammYesPair, ammNoPair, yesX, noX, usdc]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const { data: blockNumber } = useBlockNumber({ watch: !isResolved });
  const prevBlock = useRef<bigint>(0n);
  useEffect(() => {
    if (isResolved || !blockNumber || blockNumber === prevBlock.current) return;
    prevBlock.current = blockNumber;
    fetchTrades();
  }, [blockNumber, fetchTrades, isResolved]);

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-causal" />
        <span className="text-lg font-semibold">Trades</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="text-left px-4 py-2 font-medium">Market</th>
              <th className="text-right px-4 py-2 font-medium">Price</th>
              <th className="text-right px-4 py-2 font-medium">Size (USDC)</th>
              <th className="text-right px-4 py-2 font-medium">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && trades.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center text-muted-foreground text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && trades.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No trades found
                </td>
              </tr>
            )}
            {trades.map((t, i) => (
              <tr
                key={`${t.txHash}-${i}`}
                className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className={`px-4 py-2 font-medium ${t.type === "Buy" ? "text-green-400" : "text-red-400"}`}>
                  {t.type}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    t.market === "YES" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                  }`}>
                    {t.market}
                  </span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  ${t.price.toFixed(4)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-foreground/80">
                  {t.size.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                  {t.timestamp
                    ? new Date(t.timestamp * 1000).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                        hour12: true,
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
