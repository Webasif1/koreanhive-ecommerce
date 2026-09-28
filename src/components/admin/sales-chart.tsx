"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { formatBDT } from "@/lib/format";

export type SalesPoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

const HEIGHT = 240;
const PAD = { top: 16, right: 12, bottom: 30, left: 12 };

/**
 * Monotone cubic (Fritsch–Carlson). A plain smoothed curve overshoots between
 * points and would dip below zero on a day with no sales; this one never
 * leaves the range of its neighbours.
 */
function monotonePath(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0].x},${points[0].y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    slope[i] = (points[i + 1].y - points[i].y) / dx[i];
  }

  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent[i] =
      slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  tangent[n - 1] = slope[n - 2];

  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const third = dx[i] / 3;
    d += ` C${points[i].x + third},${points[i].y + tangent[i] * third} ${
      points[i + 1].x - third
    },${points[i + 1].y - tangent[i + 1] * third} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();

  // measured, not scaled: a stretched viewBox would squash the axis labels
  useEffect(() => {
    const node = wrap.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    // each series on its own scale — the tooltip carries the real numbers
    const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
    const maxOrders = Math.max(1, ...data.map((d) => d.orders));

    const x = (i: number) => PAD.left + (data.length > 1 ? i * step : innerW / 2);
    const y = (value: number, max: number) =>
      PAD.top + innerH - (value / max) * innerH * 0.9;

    const revenue = data.map((d, i) => ({ x: x(i), y: y(d.revenue, maxRevenue) }));
    const orders = data.map((d, i) => ({ x: x(i), y: y(d.orders, maxOrders) }));
    const revenuePath = monotonePath(revenue);
    const baseline = PAD.top + innerH;

    return {
      innerH,
      step,
      x,
      revenue,
      orders,
      revenuePath,
      ordersPath: monotonePath(orders),
      areaPath: revenue.length
        ? `${revenuePath} L${revenue[revenue.length - 1].x},${baseline} L${revenue[0].x},${baseline} Z`
        : "",
      baseline,
    };
  }, [data, width]);

  // about seven labels, whatever the range
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const index =
      data.length > 1 ? Math.round((px - PAD.left) / geometry.step) : 0;
    setHover(Math.min(data.length - 1, Math.max(0, index)));
  }

  const active = hover !== null ? data[hover] : null;
  const activeX = hover !== null ? geometry.x(hover) : 0;

  return (
    // overflow-hidden: the server renders at a guessed width until measured
    <div ref={wrap} className="relative w-full select-none overflow-hidden">
      <svg
        width={width}
        height={HEIGHT}
        className="block touch-none"
        role="img"
        aria-label="Revenue and orders over the selected period"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {data.map((point, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <g key={point.key}>
              <line
                x1={geometry.x(i)}
                x2={geometry.x(i)}
                y1={PAD.top}
                y2={geometry.baseline}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <text
                x={geometry.x(i)}
                y={HEIGHT - 8}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground text-[11px]"
              >
                {point.label}
              </text>
            </g>
          ) : null,
        )}

        <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
        <path
          d={geometry.ordersPath}
          fill="none"
          stroke="var(--admin-warn)"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        />
        <path
          d={geometry.revenuePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {active && (
          <g>
            <line
              x1={activeX}
              x2={activeX}
              y1={PAD.top}
              y2={geometry.baseline}
              stroke="var(--primary)"
              strokeOpacity={0.35}
              strokeDasharray="4 4"
            />
            <circle
              cx={activeX}
              cy={geometry.orders[hover!].y}
              r={4.5}
              fill="white"
              stroke="var(--admin-warn)"
              strokeWidth={2}
            />
            <circle
              cx={activeX}
              cy={geometry.revenue[hover!].y}
              r={5}
              fill="white"
              stroke="var(--primary)"
              strokeWidth={2.5}
            />
          </g>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl bg-ink px-3.5 py-3 text-white shadow-xl"
          style={{
            left: Math.min(Math.max(activeX - 88, 0), width - 176),
          }}
        >
          <p className="text-xs font-semibold">{active.label}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-white/80">
            <span className="h-3 w-0.5 rounded bg-[var(--brand-chip-border)]" />
            <span className="font-semibold text-white">{formatBDT(active.revenue)}</span>
            revenue
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-white/80">
            <span className="h-3 w-0.5 rounded bg-[var(--admin-warn-bg)]" />
            <span className="font-semibold text-white">{active.orders}</span>
            {active.orders === 1 ? "order" : "orders"}
          </p>
        </div>
      )}
    </div>
  );
}
