"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileText, Printer } from "lucide-react";
import { Badge, Button, Card, DemoNotice, PageHeader, SectionHeading } from "@/components/ui";
import { ChartFrame, ChartTooltip, axisProps } from "@/components/charts";
import { PLATFORM_META, useAnalytics } from "@/lib/use-analytics";
import {
  ENGAGEMENT_FORMULA,
  byPlatform,
  engagementRate,
  formatCompact,
  toSeries,
  weightedEngagement,
} from "@/lib/analytics";

export default function ReportsPage() {
  const { posts, summary, source, loading, notice } = useAnalytics();

  const platforms = React.useMemo(() => byPlatform(posts), [posts]);
  const series = React.useMemo(() => toSeries(posts, 30), [posts]);
  const topPosts = React.useMemo(
    () => [...posts].sort((a, b) => weightedEngagement(b) - weightedEngagement(a)).slice(0, 10),
    [posts],
  );

  /* Rendered on the client only. Formatting a date during SSR and again during
     hydration produces different strings when the server timezone differs. */
  const [generatedAt, setGeneratedAt] = React.useState("");
  React.useEffect(() => {
    setGeneratedAt(new Date().toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }));
  }, []);

  function downloadCsv() {
    const header = [
      "Title",
      "Channel",
      "Date",
      "Likes",
      "Comments",
      "Shares",
      "Reach",
      "Weighted engagement",
      "Engagement rate %",
    ];

    // Escape quotes so captions containing commas or quotes survive the round trip.
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const rows = posts.map((post) =>
      [
        escape(post.title),
        post.platform,
        post.created_at.slice(0, 10),
        post.likes,
        post.comments,
        post.shares,
        post.reach,
        weightedEngagement(post),
        engagementRate(post).toFixed(2),
      ].join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `socialpulse-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        eyebrow="Export"
        title="Performance report"
        description="A client-ready summary of the last 30 days. Print it to PDF or export the underlying rows as CSV."
        actions={
          <>
            <Button onClick={downloadCsv}>
              <Download className="size-4" />
              CSV
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print / PDF
            </Button>
          </>
        }
      />

      {source === "demo" && <DemoNotice notice={notice} />}

      <Card lit className="p-6 sm:p-8">
        {/* Report header ---------------------------------------------- */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Social performance report
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              30-day window · {summary.totalPosts} posts · {platforms.length} channel
              {platforms.length === 1 ? "" : "s"}
            </p>
            {generatedAt && (
              <p className="mt-0.5 text-xs text-ink-faint">Generated {generatedAt}</p>
            )}
          </div>
          <Badge tone={source === "demo" ? "warning" : "success"}>
            <FileText className="size-3" />
            {source === "demo" ? "Sample data" : "Live data"}
          </Badge>
        </div>

        {/* Executive summary ------------------------------------------ */}
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total reach", value: formatCompact(summary.reach) },
            { label: "Weighted engagement", value: formatCompact(summary.weighted) },
            { label: "Engagement rate", value: `${summary.rate.toFixed(2)}%` },
            { label: "Health score", value: `${summary.score}/100` },
          ].map((item) => (
            <div key={item.label} className="bg-[oklch(0.19_0.024_268)] px-5 py-6">
              <p className="text-xs uppercase tracking-wider text-ink-faint">{item.label}</p>
              <p className="tabular mt-2 text-2xl font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Daily engagement
            </h3>
            <ChartFrame height={240} className="mt-4">
              <ResponsiveContainer>
                <BarChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} minTickGap={30} />
                  <YAxis {...axisProps} tickFormatter={formatCompact} width={50} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                  <Bar
                    dataKey="engagement"
                    name="Engagement"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Channel split
            </h3>
            <ChartFrame height={200} className="mt-4">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={platforms}
                    dataKey="engagement"
                    nameKey="platform"
                    innerRadius="55%"
                    outerRadius="85%"
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
            <ul className="mt-2 space-y-1.5 text-sm">
              {platforms.map((entry) => (
                <li key={entry.platform} className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: PLATFORM_META[entry.platform]?.color }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-ink-muted">
                    {PLATFORM_META[entry.platform]?.label ?? entry.platform}
                  </span>
                  <span className="tabular text-xs text-ink">
                    {((entry.engagement / (summary.weighted || 1)) * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top posts --------------------------------------------------- */}
        <div className="mt-8">
          <SectionHeading title="Top 10 posts" description="Ranked by weighted engagement." />
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03] text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Post</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 text-right font-medium">Likes</th>
                  <th className="px-4 py-3 text-right font-medium">Comments</th>
                  <th className="px-4 py-3 text-right font-medium">Shares</th>
                  <th className="px-4 py-3 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post, index) => (
                  <tr key={post.id} className="border-b border-white/5 last:border-0">
                    <td className="tabular px-4 py-3 text-ink-faint">{index + 1}</td>
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="truncate font-medium text-ink">{post.title}</p>
                      <p className="text-xs text-ink-faint">{post.created_at.slice(0, 10)}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {PLATFORM_META[post.platform]?.label ?? post.platform}
                    </td>
                    <td className="tabular px-4 py-3 text-right text-ink-muted">
                      {formatCompact(post.likes)}
                    </td>
                    <td className="tabular px-4 py-3 text-right text-ink-muted">
                      {formatCompact(post.comments)}
                    </td>
                    <td className="tabular px-4 py-3 text-right text-ink-muted">
                      {formatCompact(post.shares)}
                    </td>
                    <td className="tabular px-4 py-3 text-right font-semibold text-emerald-300">
                      {engagementRate(post).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology -------------------------------------------------- */}
        <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
            Methodology
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Engagement is weighted because interactions differ in cost to the viewer: a
            like is one tap, a comment takes thought, and a share puts the viewer&apos;s own
            reputation behind the post. The rate expresses that weighted total as a
            share of the people actually reached.
          </p>
          <p className="mt-3 font-mono text-xs text-ink-faint">
            engagement rate = {ENGAGEMENT_FORMULA}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            The health score maps that rate onto 0–100 using a saturating curve, so a
            single viral post cannot peg the gauge permanently. Scores above 60
            correspond to a rate industry benchmarks would call strong.
          </p>
        </div>
      </Card>
    </>
  );
}
