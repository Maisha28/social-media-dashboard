"use client";

import * as React from "react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, Info, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Card, DemoNotice, PageHeader, SectionHeading, StatTile } from "@/components/ui";
import { ChartFrame, ChartTooltip, axisProps } from "@/components/charts";
import { useAnalytics } from "@/lib/use-analytics";
import { formatCompact, linearForecast, toSeries, weightedEngagement } from "@/lib/analytics";

const HORIZON = 14;

export default function PredictionsPage() {
  const { posts, source, loading, notice } = useAnalytics();

  const series = React.useMemo(() => toSeries(posts, 30), [posts]);

  const model = React.useMemo(() => {
    const values = series.map((point) => point.engagement);
    return linearForecast(values, HORIZON);
  }, [series]);

  /**
   * Confidence band. Rather than invent a statistical interval we widen the
   * band with the forecast horizon, which is honest about the fact that a
   * simple linear fit degrades the further out it reaches.
   */
  const chartData = React.useMemo(() => {
    const actual = series.map((point, index) => ({
      label: point.label,
      actual: point.engagement,
      fitted: Math.max(0, model.predict(index + 1)),
      band: undefined as [number, number] | undefined,
    }));

    const lastDate = new Date();
    const projected = model.forecast.map((value, index) => {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + index + 1);
      const spread = value * (0.12 + (index / HORIZON) * 0.28);
      return {
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        actual: undefined as number | undefined,
        fitted: value,
        band: [Math.max(0, value - spread), value + spread] as [number, number],
      };
    });

    return [...actual, ...projected];
  }, [series, model]);

  const recentAverage = React.useMemo(() => {
    const window = series.slice(-7);
    if (window.length === 0) return 0;
    return window.reduce((total, point) => total + point.engagement, 0) / window.length;
  }, [series]);

  const projectedAverage = React.useMemo(() => {
    if (model.forecast.length === 0) return 0;
    return model.forecast.reduce((total, value) => total + value, 0) / model.forecast.length;
  }, [model.forecast]);

  const changePercent =
    recentAverage > 0 ? ((projectedAverage - recentAverage) / recentAverage) * 100 : 0;
  const rising = model.slope >= 0;

  /* Best posting windows, derived from when the strongest posts actually went
     out rather than from a generic "post at 6pm" rule of thumb. */
  const bestDays = React.useMemo(() => {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const totals = new Array(7).fill(0).map(() => ({ engagement: 0, count: 0 }));

    for (const post of posts) {
      const day = new Date(post.created_at).getDay();
      totals[day].engagement += weightedEngagement(post);
      totals[day].count += 1;
    }

    return totals
      .map((entry, index) => ({
        day: names[index],
        average: entry.count > 0 ? Math.round(entry.engagement / entry.count) : 0,
        count: entry.count,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.average - a.average);
  }, [posts]);

  if (loading) {
    return (
      <>
        <div className="skeleton h-16 w-72 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Forecast"
        title="Predictions"
        description={`A least-squares trend fitted to the last ${series.length} days, projected ${HORIZON} days forward.`}
        actions={
          <Badge tone={rising ? "success" : "warning"}>
            {rising ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {rising ? "Trending up" : "Trending down"}
          </Badge>
        }
      />

      {source === "demo" && <DemoNotice notice={notice} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="7-day average"
          value={Math.round(recentAverage)}
          accent="cyan"
          hint="weighted engagement/day"
          format={formatCompact}
        />
        <StatTile
          label={`Projected avg (${HORIZON}d)`}
          value={Math.round(projectedAverage)}
          delta={Number(changePercent.toFixed(1))}
          accent="brand"
          format={formatCompact}
        />
        <StatTile
          label="Daily trend"
          value={Math.round(Math.abs(model.slope))}
          accent={rising ? "emerald" : "rose"}
          hint={rising ? "gain per day" : "loss per day"}
          format={formatCompact}
        />
        <StatTile
          label={`${HORIZON}-day total`}
          value={Math.round(model.forecast.reduce((a, b) => a + b, 0))}
          accent="amber"
          hint="projected engagement"
          format={formatCompact}
        />
      </div>

      <Card lit className="p-5 sm:p-6">
        <SectionHeading
          title="Engagement forecast"
          description="Solid line is observed history; the shaded cone is the projection and its widening uncertainty."
        />
        <ChartFrame height={360} className="mt-5">
          <ResponsiveContainer>
            {/* Extra top margin keeps the "today" reference label off the edge. */}
            <ComposedChart data={chartData} margin={{ top: 22, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axisProps} minTickGap={30} />
              <YAxis {...axisProps} tickFormatter={formatCompact} width={52} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-muted)", paddingTop: 8 }} />

              <ReferenceLine
                x={series[series.length - 1]?.label}
                stroke="var(--line-strong)"
                strokeDasharray="4 4"
                label={{ value: "today", fill: "var(--ink-faint)", fontSize: 11, position: "top" }}
              />
              <Area
                dataKey="band"
                name="Confidence range"
                stroke="none"
                fill="url(#gradBand)"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Observed"
                stroke="var(--chart-2)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fitted"
                name="Trend / forecast"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>

        <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
          This is a linear extrapolation of past engagement, not a guarantee. It assumes
          your posting cadence and audience stay roughly constant — a campaign, an
          algorithm change or a viral post will all break the projection.
        </p>
      </Card>

      <Card lit className="p-5 sm:p-6">
        <SectionHeading
          title="Best days to publish"
          description="Average weighted engagement per post, by the day it went out."
          action={
            <span className="chip">
              <CalendarClock className="size-3" />
              Based on {posts.length} posts
            </span>
          }
        />
        <ul className="mt-5 space-y-2.5">
          {bestDays.map((entry, index) => {
            const max = bestDays[0]?.average || 1;
            return (
              <li key={entry.day} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-ink-muted">{entry.day}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-white/5">
                  <div
                    className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-violet-600/70 to-cyan-500/70 px-2.5 transition-[width] duration-700"
                    style={{ width: `${Math.max(8, (entry.average / max) * 100)}%` }}
                  >
                    <span className="tabular text-xs font-semibold text-white">
                      {formatCompact(entry.average)}
                    </span>
                  </div>
                </div>
                {index === 0 && <Badge tone="success">Best</Badge>}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
