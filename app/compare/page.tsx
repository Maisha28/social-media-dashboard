"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GitCompareArrows, Trophy } from "lucide-react";
import { Badge, Card, DemoNotice, EmptyState, PageHeader, SectionHeading } from "@/components/ui";
import { ChartFrame, ChartTooltip, axisProps } from "@/components/charts";
import { PLATFORM_META, useAnalytics } from "@/lib/use-analytics";
import { engagementRate, formatCompact, summarize, toSeries, weightedEngagement } from "@/lib/analytics";

export default function ComparePage() {
  const { posts, source, loading, notice } = useAnalytics();

  const platforms = React.useMemo(
    () => [...new Set(posts.map((post) => post.platform))],
    [posts],
  );

  const [selected, setSelected] = React.useState<string[]>([]);

  // Default to the two channels with the most posts, once data arrives.
  React.useEffect(() => {
    if (selected.length > 0 || platforms.length === 0) return;
    const ranked = [...platforms].sort(
      (a, b) =>
        posts.filter((p) => p.platform === b).length -
        posts.filter((p) => p.platform === a).length,
    );
    setSelected(ranked.slice(0, Math.min(3, ranked.length)));
  }, [platforms, posts, selected.length]);

  const stats = React.useMemo(
    () =>
      selected.map((platform) => {
        const subset = posts.filter((post) => post.platform === platform);
        return {
          platform,
          label: PLATFORM_META[platform]?.label ?? platform,
          color: PLATFORM_META[platform]?.color ?? "var(--chart-4)",
          summary: summarize(subset),
          posts: subset,
        };
      }),
    [selected, posts],
  );

  const comparisonBars = React.useMemo(
    () =>
      (["likes", "comments", "shares"] as const).map((metric) => {
        const row: Record<string, string | number> = { metric };
        for (const entry of stats) row[entry.label] = entry.summary[metric];
        return row;
      }),
    [stats],
  );

  /* Radar needs every axis on a comparable 0–100 scale, so each metric is
     normalised against the strongest channel rather than plotted raw. */
  const radarData = React.useMemo(() => {
    const axes = [
      { key: "Reach", read: (s: ReturnType<typeof summarize>) => s.reach },
      { key: "Likes", read: (s: ReturnType<typeof summarize>) => s.likes },
      { key: "Comments", read: (s: ReturnType<typeof summarize>) => s.comments },
      { key: "Shares", read: (s: ReturnType<typeof summarize>) => s.shares },
      { key: "Rate", read: (s: ReturnType<typeof summarize>) => s.rate },
      { key: "Volume", read: (s: ReturnType<typeof summarize>) => s.totalPosts },
    ];

    return axes.map((axis) => {
      const values = stats.map((entry) => axis.read(entry.summary));
      const max = Math.max(...values, 1);
      const row: Record<string, string | number> = { axis: axis.key };
      stats.forEach((entry, index) => {
        row[entry.label] = Math.round((values[index] / max) * 100);
      });
      return row;
    });
  }, [stats]);

  const trendData = React.useMemo(() => {
    if (stats.length === 0) return [];
    const perPlatform = stats.map((entry) => toSeries(entry.posts, 30));
    return perPlatform[0].map((point, index) => {
      const row: Record<string, string | number> = { label: point.label };
      stats.forEach((entry, i) => {
        row[entry.label] = perPlatform[i][index]?.engagement ?? 0;
      });
      return row;
    });
  }, [stats]);

  const winner = React.useMemo(() => {
    if (stats.length === 0) return null;
    return [...stats].sort((a, b) => b.summary.rate - a.summary.rate)[0];
  }, [stats]);

  function toggle(platform: string) {
    setSelected((current) =>
      current.includes(platform)
        ? current.filter((key) => key !== platform)
        : [...current, platform],
    );
  }

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
        eyebrow="Analysis"
        title="Compare channels"
        description="Put your channels side by side on reach, engagement mix and efficiency to see where the next post belongs."
      />

      {source === "demo" && <DemoNotice notice={notice} />}

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <span className="mr-1 text-sm text-ink-muted">Channels</span>
        {platforms.map((platform) => {
          const active = selected.includes(platform);
          return (
            <button
              key={platform}
              type="button"
              onClick={() => toggle(platform)}
              aria-pressed={active}
              className={`chip transition-colors ${
                active ? "!border-violet-400/40 !bg-violet-400/15 !text-violet-200" : ""
              }`}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: PLATFORM_META[platform]?.color }}
                aria-hidden
              />
              {PLATFORM_META[platform]?.label ?? platform}
            </button>
          );
        })}
      </Card>

      {stats.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GitCompareArrows className="size-5" />}
            title="Pick at least one channel"
            description="Select channels above to build the comparison."
          />
        </Card>
      ) : (
        <>
          {/* Scorecards ---------------------------------------------- */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((entry) => (
              <Card key={entry.platform} interactive lit className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-3 rounded-full"
                      style={{ background: entry.color }}
                      aria-hidden
                    />
                    <h3 className="font-semibold text-ink">{entry.label}</h3>
                  </div>
                  {winner?.platform === entry.platform && (
                    <Badge tone="success">
                      <Trophy className="size-3" />
                      Best rate
                    </Badge>
                  )}
                </div>

                <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                  <span className="tabular">{entry.summary.rate.toFixed(2)}</span>
                  <span className="text-lg text-ink-faint">%</span>
                </p>
                <p className="text-xs text-ink-faint">engagement rate</p>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-white/8 pt-4 text-sm">
                  <Cell label="Posts" value={String(entry.summary.totalPosts)} />
                  <Cell label="Reach" value={formatCompact(entry.summary.reach)} />
                  <Cell label="Likes" value={formatCompact(entry.summary.likes)} />
                  <Cell label="Comments" value={formatCompact(entry.summary.comments)} />
                  <Cell label="Shares" value={formatCompact(entry.summary.shares)} />
                  <Cell label="Score" value={`${entry.summary.score}/100`} />
                </dl>
              </Card>
            ))}
          </div>

          {/* Trend ---------------------------------------------------- */}
          <Card lit className="p-5 sm:p-6">
            <SectionHeading
              title="Engagement over time"
              description="Weighted engagement per day for each selected channel."
            />
            <ChartFrame height={300} className="mt-5">
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={28} />
                  <YAxis {...axisProps} tickFormatter={formatCompact} width={52} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "var(--ink-muted)", paddingTop: 8 }}
                  />
                  {stats.map((entry) => (
                    <Line
                      key={entry.platform}
                      type="monotone"
                      dataKey={entry.label}
                      stroke={entry.color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Metric bars ------------------------------------------- */}
            <Card lit className="p-5 sm:p-6">
              <SectionHeading
                title="Interaction mix"
                description="Raw totals per interaction type."
              />
              <ChartFrame height={300} className="mt-5">
                <ResponsiveContainer>
                  <BarChart data={comparisonBars} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="metric" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={formatCompact} width={52} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: "var(--ink-muted)", paddingTop: 8 }}
                    />
                    {stats.map((entry) => (
                      <Bar
                        key={entry.platform}
                        dataKey={entry.label}
                        fill={entry.color}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={38}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Card>

            {/* Radar -------------------------------------------------- */}
            <Card lit className="p-5 sm:p-6">
              <SectionHeading
                title="Channel profile"
                description="Each axis normalised to the strongest channel (100)."
              />
              <ChartFrame height={300} className="mt-5">
                <ResponsiveContainer>
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="oklch(1 0 0 / 0.08)" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip valueFormatter={(n) => String(n)} />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: "var(--ink-muted)", paddingTop: 8 }}
                    />
                    {stats.map((entry) => (
                      <Radar
                        key={entry.platform}
                        name={entry.label}
                        dataKey={entry.label}
                        stroke={entry.color}
                        fill={entry.color}
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Card>
          </div>

          {/* Head to head ------------------------------------------- */}
          <Card lit className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <SectionHeading
                title="Best post per channel"
                description="The single highest-engagement post on each channel."
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-y border-white/8 text-left text-xs uppercase tracking-wider text-ink-faint">
                    <th className="px-5 py-3 font-medium sm:px-6">Channel</th>
                    <th className="px-3 py-3 font-medium">Top post</th>
                    <th className="px-3 py-3 text-right font-medium">Reach</th>
                    <th className="px-5 py-3 text-right font-medium sm:px-6">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((entry) => {
                    const best = [...entry.posts].sort(
                      (a, b) => weightedEngagement(b) - weightedEngagement(a),
                    )[0];
                    if (!best) return null;
                    return (
                      <tr key={entry.platform} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-3.5 sm:px-6">
                          <span className="chip">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ background: entry.color }}
                              aria-hidden
                            />
                            {entry.label}
                          </span>
                        </td>
                        <td className="max-w-[320px] px-3 py-3.5">
                          <p className="truncate font-medium text-ink">{best.title}</p>
                        </td>
                        <td className="tabular px-3 py-3.5 text-right text-ink-muted">
                          {formatCompact(best.reach)}
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <span className="tabular font-semibold text-emerald-300">
                            {engagementRate(best).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="tabular font-semibold text-ink">{value}</dd>
    </div>
  );
}
