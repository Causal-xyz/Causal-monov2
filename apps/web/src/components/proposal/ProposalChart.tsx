"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";
import { usePoolPrice } from "@/hooks/usePoolPrice";

interface PricePoint {
  time: UTCTimestamp;
  pass: number;
  fail: number;
  spot: number;
}

interface ProposalChartProps {
  readonly ammYesPair: `0x${string}`;
  readonly ammNoPair: `0x${string}`;
  readonly yesX: `0x${string}` | undefined;
  readonly noX: `0x${string}` | undefined;
  readonly usdc: `0x${string}`;
}

type TimeRange = "1H" | "4H" | "1D" | "MAX";

const POLL_INTERVAL_MS = 30_000;

const STORAGE_KEY = (addr: string) => `causal:chart:${addr.toLowerCase()}`;
const MAX_STORED_POINTS = 2000;

function loadHistory(addr: string): PricePoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(addr));
    if (!raw) return [];
    return JSON.parse(raw) as PricePoint[];
  } catch {
    return [];
  }
}

function saveHistory(addr: string, history: PricePoint[]) {
  try {
    const trimmed = history.slice(-MAX_STORED_POINTS);
    localStorage.setItem(STORAGE_KEY(addr), JSON.stringify(trimmed));
  } catch {
    // storage full — ignore
  }
}

export function ProposalChart({
  ammYesPair,
  ammNoPair,
  yesX,
  noX,
  usdc,
}: ProposalChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const passSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const failSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const spotSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const historyRef = useRef<PricePoint[]>(loadHistory(ammYesPair));
  const [timeRange, setTimeRange] = useState<TimeRange>("MAX");
  const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0 });
  const [latestPrices, setLatestPrices] = useState({ pass: 0, fail: 0, spot: 0 });

  const yesPool = usePoolPrice(ammYesPair, yesX, usdc);
  const noPool = usePoolPrice(ammNoPair, noX, usdc);

  // Accumulate price history via polling
  useEffect(() => {
    const passPrice = yesPool.price ?? 0;
    const failPrice = noPool.price ?? 0;
    if (passPrice === 0 && failPrice === 0) return;

    const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const spot = (passPrice + failPrice) / 2;

    const last = historyRef.current[historyRef.current.length - 1];
    // Only add if time advanced (avoid duplicate timestamps)
    if (!last || now > last.time) {
      historyRef.current.push({ time: now, pass: passPrice, fail: failPrice, spot });
    } else {
      // Update the last point with fresh data
      historyRef.current[historyRef.current.length - 1] = { time: last.time, pass: passPrice, fail: failPrice, spot };
    }
    saveHistory(ammYesPair, historyRef.current);

    setLatestPrices({ pass: passPrice, fail: failPrice, spot });

    const spots = historyRef.current.map((p) => p.spot);
    setOhlc({
      open: spots[0] ?? spot,
      high: Math.max(...spots),
      low: Math.min(...spots),
      close: spot,
    });

    updateChartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yesPool.price, noPool.price]);

  // Poll every 30s even without price change
  useEffect(() => {
    const id = setInterval(() => {
      // Trigger a no-op state touch to force re-poll
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const getFilteredData = useCallback(
    (range: TimeRange): PricePoint[] => {
      const all = historyRef.current;
      if (range === "MAX" || all.length === 0) return all;
      const now = Date.now() / 1000;
      const cutoffs: Record<TimeRange, number> = {
        "1H": now - 3600,
        "4H": now - 14400,
        "1D": now - 86400,
        MAX: 0,
      };
      return all.filter((p) => p.time >= cutoffs[range]);
    },
    []
  );

  const updateChartData = useCallback(() => {
    const data = getFilteredData(timeRange);
    if (!passSeriesRef.current || !failSeriesRef.current || !spotSeriesRef.current) return;
    const toLine = (key: "pass" | "fail" | "spot") =>
      data.map((p): LineData => ({ time: p.time, value: p[key] }));
    passSeriesRef.current.setData(toLine("pass"));
    failSeriesRef.current.setData(toLine("fail"));
    spotSeriesRef.current.setData(toLine("spot"));
    chartRef.current?.timeScale().fitContent();
  }, [timeRange, getFilteredData]);

  // Update chart when time range changes
  useEffect(() => {
    updateChartData();
  }, [timeRange, updateChartData]);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(156, 163, 175, 1)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.2)", width: 1 },
        horzLine: { color: "rgba(255,255,255,0.2)", width: 1 },
      },
      width: containerRef.current.clientWidth,
      height: 260,
    });

    // PASS series (green)
    const passSeries = chart.addSeries(LineSeries, {
      color: "#1FBF75",
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      title: "PASS",
    });

    // FAIL series (red)
    const failSeries = chart.addSeries(LineSeries, {
      color: "#E04F4F",
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      title: "FAIL",
    });

    // SPOT series (grey dashed)
    const spotSeries = chart.addSeries(LineSeries, {
      color: "rgba(160,160,160,0.7)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      title: "SPOT",
    });

    chartRef.current = chart;
    passSeriesRef.current = passSeries;
    failSeriesRef.current = failSeries;
    spotSeriesRef.current = spotSeries;

    // Seed with current data if available
    if (historyRef.current.length > 0) {
      const toLine = (key: "pass" | "fail" | "spot") =>
        historyRef.current.map((p): LineData => ({ time: p.time, value: p[key] }));
      passSeries.setData(toLine("pass"));
      failSeries.setData(toLine("fail"));
      spotSeries.setData(toLine("spot"));
      chart.timeScale().fitContent();
    }

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) chart.resize(w, 260);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasData = historyRef.current.length > 0 || (yesPool.price ?? 0) > 0;

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 overflow-hidden min-w-0">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1FBF75]" />
          <span className="tabular-nums font-medium text-foreground">
            ${latestPrices.pass > 0 ? latestPrices.pass.toFixed(4) : "—"}
          </span>
          <span className="text-muted-foreground">IF APPROVED</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#E04F4F]" />
          <span className="tabular-nums font-medium text-foreground">
            ${latestPrices.fail > 0 ? latestPrices.fail.toFixed(4) : "—"}
          </span>
          <span className="text-muted-foreground">IF REJECTED</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[rgba(160,160,160,0.7)]" />
          <span className="tabular-nums font-medium text-foreground">
            ${latestPrices.spot > 0 ? latestPrices.spot.toFixed(4) : "—"}
          </span>
          <span className="text-muted-foreground">SPOT</span>
        </span>
      </div>

      {/* OHLC bar */}
      {ohlc.open > 0 && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          {(["open", "high", "low", "close"] as const).map((k) => (
            <span key={k} className="flex gap-1">
              <span className="uppercase font-medium text-foreground/50">{k}</span>
              <span className="tabular-nums">${ohlc[k].toFixed(4)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground z-10">
            Waiting for price data…
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>

      {/* Time controls */}
      <div className="flex items-center justify-end gap-1">
        {(["1H", "4H", "1D", "MAX"] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              timeRange === r
                ? "bg-causal text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
