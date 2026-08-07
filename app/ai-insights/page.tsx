"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Lightbulb, Sparkles, Target } from "lucide-react";
import { Badge, Card, DemoNotice, PageHeader, SectionHeading } from "@/components/ui";
import { useAnalytics } from "@/lib/use-analytics";
import { deriveInsights } from "@/lib/insights";

export default function AiInsightsPage() {
  const { posts, summary, source, loading, notice } = useAnalytics();
  const [filter, setFilter] = React.useState("All");

  const insights = React.useMemo(() => deriveInsights(posts), [posts]);
  const categories = React.useMemo(
    () => ["All", ...new Set(insights.map((entry) => entry.category))],
    [insights],
  );
  const visible = insights.filter((entry) => filter === "All" || entry.category === filter);

  if (loading) {
    return (
      <>
        <div className="skeleton h-16 w-72 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Intelligence"
        title="AI insights"
        description="Observations derived from your own numbers. Every claim below cites a figure you can check on the dashboard."
        actions={
          <Link href="/ask-ai" className="btn btn-primary">
            <Sparkles className="size-4" />
            Ask a question
          </Link>
        }
      />

      {source === "demo" && <DemoNotice notice={notice} />}

      {/* Headline strip ------------------------------------------------ */}
      <Card lit className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
        <Headline
          icon={<Flame className="size-4.5" />}
          label="Engagement score"
          value={`${summary.score}/100`}
          sub={summary.grade}
        />
        <Headline
          icon={<Target className="size-4.5" />}
          label="Engagement rate"
          value={`${summary.rate.toFixed(2)}%`}
          sub={`across ${summary.totalPosts} posts`}
        />
        <Headline
          icon={<Lightbulb className="size-4.5" />}
          label="Insights found"
          value={String(insights.length)}
          sub="from the last 30 days"
        />
      </Card>

      <SectionHeading
        title="What the data says"
        action={
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilter(category)}
                className={`chip transition-colors ${
                  filter === category
                    ? "!border-violet-400/40 !bg-violet-400/15 !text-violet-200"
                    : ""
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Card
              key={insight.id}
              interactive
              lit
              className="animate-rise p-5 sm:p-6"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
                  <Icon className="size-4.5" />
                </span>
                <div className="flex items-center gap-2">
                  <Badge tone={insight.tone}>{insight.category}</Badge>
                </div>
              </div>

              <h3 className="mt-4 text-base font-semibold leading-snug text-ink">
                {insight.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{insight.body}</p>

              <div className="mt-4 flex items-center gap-2.5 border-t border-white/8 pt-3.5">
                <span className="text-xs text-ink-faint">Confidence</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    style={{ width: `${insight.confidence * 100}%` }}
                  />
                </div>
                <span className="tabular text-xs font-medium text-ink-muted">
                  {Math.round(insight.confidence * 100)}%
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Headline({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="tabular text-xl font-semibold text-ink">{value}</p>
        <p className="truncate text-xs text-ink-muted">{sub}</p>
      </div>
    </div>
  );
}
