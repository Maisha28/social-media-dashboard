"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Eye,
  Heart,
  Link2,
  MessageCircle,
  RefreshCw,
  Repeat2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DemoNotice,
  PageHeader,
  SectionHeading,
  StatTile,
} from "@/components/ui";
import { ChartFrame, ChartTooltip, axisProps } from "@/components/charts";
import { PLATFORM_META, useAnalytics } from "@/lib/use-analytics";
import {
  ENGAGEMENT_FORMULA,
  byPlatform,
  engagementRate,
  formatCompact,
  percentChange,
  toSeries,
  weightedEngagement,
} from "@/lib/analytics";

export default function DashboardPage() {
  const { posts, summary, source, loading, notice, refresh } = useAnalytics();

  const series = React.useMemo(() => toSeries(posts, 30), [posts]);
  const platforms = React.useMemo(() => byPlatform(posts), [posts]);

  /* Compare the most recent 15 days against the 15 before them so the stat
     tiles can show a direction of travel rather than a bare total. */
  const deltas = React.useMemo(() => {
    const half = Math.floor(series.length / 2);
    if (half === 0) return null;
    const previous = series.slice(0, half);
    const current = series.slice(half);
    const sum = (rows: typeof series, key: "likes" | "comments" | "shares" | "reach") =>
      rows.reduce((total, row) => total + row[key], 0);

    return {
      likes: percentChange(sum(current, "likes"), sum(previous, "likes")),
      comments: percentChange(sum(current, "comments"), sum(previous, "comments")),
      shares: percentChange(sum(current, "shares"), sum(previous, "shares")),
      reach: percentChange(sum(current, "reach"), sum(previous, "reach")),
    };
  }, [series]);

  const topPosts = React.useMemo(
    () => [...posts].sort((a, b) => weightedEngagement(b) - weightedEngagement(a)).slice(0, 5),
    [posts],
  );

  const gaugeData = [{ name: "score", value: summary.score, fill: "var(--chart-1)" }];

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Performance dashboard"
        description={`${summary.totalPosts} posts across ${platforms.length} channel${platforms.length === 1 ? "" : "s"} over the last 30 days.`}
        actions={
          <>
            <Badge tone={source === "meta" ? "success" : source === "supabase" ? "info" : "warning"}>
              {source === "meta"
                ? "Live from Meta"
                : source === "supabase"
                  ? "Supabase"
                  : "Sample data"}
            </Badge>
            <Button onClick={refresh}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      {source === "demo" && <DemoNotice notice={notice} />}

      {/* Stat tiles ---------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total reach"
          value={summary.reach}
          delta={deltas?.reach}
          hint="vs previous 15 days"
          accent="cyan"
          format={formatCompact}
          icon={<Eye className="size-4.5" />}
        />
        <StatTile
          label="Likes"
          value={summary.likes}
          delta={deltas?.likes}
          hint="weight ×1"
          accent="rose"
          format={formatCompact}
          icon={<Heart className="size-4.5" />}
        />
        <StatTile
          label="Comments"
          value={summary.comments}
          delta={deltas?.comments}
          hint="weight ×2"
          accent="amber"
          format={formatCompact}
          icon={<MessageCircle className="size-4.5" />}
        />
        <StatTile
          label="Shares"
          value={summary.shares}
          delta={deltas?.shares}
          hint="weight ×3"
          accent="emerald"
          format={formatCompact}
          icon={<Repeat2 className="size-4.5" />}
        />
      </div>

      {/* Trend + score ------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card lit className="p-5 sm:p-6">
          <SectionHeading
            title="Engagement trend"
            description="Weighted engagement and reach, day by day."
          />
          <ChartFrame height={300} className="mt-5">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" {...axisProps} minTickGap={28} />
                {/* Reach runs an order of magnitude above engagement, so they
                    get separate axes — on a shared axis engagement flatlines. */}
                <YAxis
                  yAxisId="reach"
                  {...axisProps}
                  tickFormatter={formatCompact}
                  width={52}
                />
                <YAxis
                  yAxisId="engagement"
                  orientation="right"
                  {...axisProps}
                  tickFormatter={formatCompact}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
                <Area
                  yAxisId="reach"
                  type="monotone"
                  dataKey="reach"
                  name="Reach"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill="url(#gradReach)"
                />
                <Area
                  yAxisId="engagement"
                  type="monotone"
                  dataKey="engagement"
                  name="Engagement"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#gradEngagement)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Card>

        <Card lit className="flex flex-col p-5 sm:p-6">
          <SectionHeading title="Engagement score" description="0–100, benchmarked on rate." />

          <div className="relative mx-auto mt-4">
            <ChartFrame height={200} className="w-[200px]">
              <ResponsiveContainer>
                <RadialBarChart
                  data={gaugeData}
                  innerRadius="72%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "oklch(1 0 0 / 0.06)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartFrame>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="tabular text-4xl font-semibold text-ink">{summary.score}</p>
                <p className="mt-0.5 text-xs text-ink-faint">out of 100</p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-2.5 pt-4">
            <Row label="Grade" value={<Badge tone="brand">{summary.grade}</Badge>} />
            <Row
              label="Engagement rate"
              value={
                <span className="tabular font-semibold text-ink">
                  {summary.rate.toFixed(2)}%
                </span>
              }
            />
            <Row
              label="Weighted total"
              value={
                <span className="tabular font-semibold text-ink">
                  {formatCompact(summary.weighted)}
                </span>
              }
            />
            <p className="border-t border-white/8 pt-3 font-mono text-[11px] leading-relaxed text-ink-faint">
              {ENGAGEMENT_FORMULA}
            </p>
          </div>
        </Card>
      </div>

      {/* Channels ------------------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card lit className="p-5 sm:p-6">
          <SectionHeading title="Channel mix" description="Share of total engagement." />
          <ChartFrame height={260} className="mt-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={platforms}
                  dataKey="engagement"
                  nameKey="platform"
                  innerRadius="58%"
                  outerRadius="86%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {platforms.map((entry) => (
                    <Cell
                      key={entry.platform}
                      fill={PLATFORM_META[entry.platform]?.color ?? "var(--chart-4)"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
          <ul className="mt-2 space-y-2">
            {platforms.map((entry) => (
              <li key={entry.platform} className="flex items-center gap-2.5 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: PLATFORM_META[entry.platform]?.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate text-ink-muted">
                  {PLATFORM_META[entry.platform]?.label ?? entry.platform}
                </span>
                <span className="tabular text-xs text-ink-faint">{entry.posts} posts</span>
                <span className="tabular w-14 text-right font-semibold text-ink">
                  {formatCompact(entry.engagement)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card lit className="p-5 sm:p-6">
          <SectionHeading
            title="Reach by channel"
            description="Where your content is actually being seen."
          />
          <ChartFrame height={320} className="mt-5">
            <ResponsiveContainer>
              <BarChart
                data={platforms.map((entry) => ({
                  ...entry,
                  label: PLATFORM_META[entry.platform]?.label ?? entry.platform,
                }))}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" {...axisProps} tickFormatter={formatCompact} />
                <YAxis type="category" dataKey="label" {...axisProps} width={84} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                <Bar dataKey="reach" name="Reach" radius={[0, 8, 8, 0]} barSize={22}>
                  {platforms.map((entry) => (
                    <Cell
                      key={entry.platform}
                      fill={PLATFORM_META[entry.platform]?.color ?? "var(--chart-4)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Card>
      </div>

      {/* Top posts ----------------------------------------------------- */}
      <Card lit className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <SectionHeading
            title="Top performing posts"
            description="Ranked by weighted engagement."
            action={
              <Link href="/content" className="btn btn-ghost !py-2 text-xs">
                View all content
              </Link>
            }
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-white/8 text-left text-xs uppercase tracking-wider text-ink-faint">
                <th className="px-5 py-3 font-medium sm:px-6">Post</th>
                <th className="px-3 py-3 font-medium">Channel</th>
                <th className="px-3 py-3 text-right font-medium">Reach</th>
                <th className="px-3 py-3 text-right font-medium">Engagement</th>
                <th className="px-5 py-3 text-right font-medium sm:px-6">Rate</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post) => {
                const meta = PLATFORM_META[post.platform];
                return (
                  <tr
                    key={post.id}
                    className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="max-w-[320px] px-5 py-3.5 sm:px-6">
                      <p className="truncate font-medium text-ink">{post.title}</p>
                      <p className="truncate text-xs text-ink-faint">
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="chip">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: meta?.color }}
                          aria-hidden
                        />
                        {meta?.label ?? post.platform}
                      </span>
                    </td>
                    <td className="tabular px-3 py-3.5 text-right text-ink-muted">
                      {formatCompact(post.reach)}
                    </td>
                    <td className="tabular px-3 py-3.5 text-right font-semibold text-ink">
                      {formatCompact(weightedEngagement(post))}
                    </td>
                    <td className="px-5 py-3.5 text-right sm:px-6">
                      <span className="tabular font-semibold text-emerald-300">
                        {engagementRate(post).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cross-links --------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/ai-insights"
          icon={<Sparkles className="size-4.5" />}
          title="AI insights"
          body="What changed this week, and what to do about it."
        />
        <QuickLink
          href="/predictions"
          icon={<TrendingUp className="size-4.5" />}
          title="Forecast"
          body="Projected engagement for the next two weeks."
        />
        <QuickLink
          href="/connections"
          icon={<Link2 className="size-4.5" />}
          title="Connect accounts"
          body="Swap sample data for your own Instagram and Facebook."
        />
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      {value}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="group">
      <Card interactive className="h-full p-5">
        <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300 transition-colors group-hover:text-violet-200">
          {icon}
        </span>
        <p className="mt-3.5 font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="skeleton h-16 w-72 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </>
  );
}
