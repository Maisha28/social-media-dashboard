"use client";

import * as React from "react";
import { formatCompact } from "@/lib/analytics";

/** Themed tooltip shared by every Recharts surface in the app. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = formatCompact,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string | number;
  valueFormatter?: (n: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="glass rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      {label !== undefined && (
        <p className="mb-1.5 font-semibold text-ink">{String(label)}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: entry.color }}
              aria-hidden
            />
            <span className="text-ink-muted capitalize">{entry.name ?? entry.dataKey}</span>
            <span className="tabular ml-auto font-semibold text-ink">
              {valueFormatter(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const axisProps = {
  stroke: "transparent",
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--ink-faint)", fontSize: 11 },
} as const;

/**
 * Recharts' ResponsiveContainer measures its parent, so it needs a parent with
 * a real height. This wrapper supplies one and keeps the markup honest about
 * horizontal overflow on small screens.
 */
export function ChartFrame({
  height = 280,
  children,
  className,
}: {
  height?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className} style={{ width: "100%", height }}>
      {children}
    </div>
  );
}
