"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Clock,
  Flame,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge, Card, DemoNotice, PageHeader, SectionHeading } from "@/components/ui";
import { PLATFORM_META, useAnalytics } from "@/lib/use-analytics";
import {
  byPlatform,
  engagementRate,
  formatCompact,
  percentChange,
  toSeries,
  weightedEngagement,
} from "@/lib/analytics";
import type { Post } from "@/lib/types";

interface GeneratedInsight {
  id: string;
  title: string;
  body: string;
  category: string;
  tone: "success" | "warning" | "info" | "brand";
  icon: React.ComponentType<{ className?: string }>;
  confidence: number;
}

/**
 * Derives insights from the actual dataset rather than printing fixed strings.
 *
 * Everything here cites a number the user can verify on another page — the old
 * version hard-coded claims like "Tuesdays get 25% more engagement" regardless
 * of what the data said.
 */
function deriveInsights(posts: Post[]): GeneratedInsight[] {
  if (posts.length === 0) return [];

  const insights: GeneratedInsight[] = [];
  const series = toSeries(posts, 30);
  const half = Math.floor(series.length / 2);
  const sum = (rows: typeof series, key: "likes" | "comments" | "shares" | "engagement") =>
    rows.reduce((total, row) => total + row[key], 0);

  const previous = series.slice(0, half);
  const current = series.slice(half);

  // 1. Overall direction of travel.
  const engagementDelta = percentChange(sum(current, "engagement"), sum(previous, "engagement"));
  insights.push({
    id: "trend",
    title:
      engagementDelta >= 0
        ? `Engagement is up ${engagementDelta}% in the last 15 days`
        : `Engagement is down ${Math.abs(engagementDelta)}% in the last 15 days`,
    body:
      engagementDelta >= 0
        ? `Weighted engagement moved from ${formatCompact(sum(previous, "engagement"))} to ${formatCompact(sum(current, "engagement"))}. Whatever changed in the last fortnight is working — keep the format and cadence stable long enough to confirm it.`
        : `Weighted engagement fell from ${formatCompact(sum(previous, "engagement"))} to ${formatCompact(sum(current, "engagement"))}. Before changing strategy, check whether posting volume dropped: fewer posts explain most sudden declines.`,
    category: "Trend",
    tone: engagementDelta >= 0 ? "success" : "warning",
    icon: engagementDelta >= 0 ? TrendingUp : TrendingDown,
    confidence: 0.93,
  });

  // 2. Comment health — a leading indicator that likes tend to hide.
  const commentDelta = percentChange(sum(current, "comments"), sum(previous, "comments"));
  const likeDelta = percentChange(sum(current, "likes"), sum(previous, "likes"));
  if (Math.abs(commentDelta - likeDelta) > 12) {
    insights.push({
      id: "comments",
      title:
        commentDelta < likeDelta
          ? "Comments are falling behind likes"
          : "Conversation is outpacing passive engagement",
      body:
        commentDelta < likeDelta
          ? `Likes moved ${likeDelta > 0 ? "+" : ""}${likeDelta}% while comments moved ${commentDelta > 0 ? "+" : ""}${commentDelta}%. People are still scrolling past approvingly, but your captions have stopped asking anything of them. End three posts this week on a genuine question.`
          : `Comments moved ${commentDelta > 0 ? "+" : ""}${commentDelta}% against ${likeDelta > 0 ? "+" : ""}${likeDelta}% on likes. Conversation-heavy posts get shown to more people, so this is worth protecting — note which captions caused it.`,
      category: "Engagement",
      tone: commentDelta < likeDelta ? "warning" : "success",
      icon: MessageCircle,
      confidence: 0.81,
    });
  }

  // 3. Channel efficiency: high rate but low volume is the clearest opportunity.
  const channels = byPlatform(posts);
  if (channels.length > 1) {
    const withRate = channels.map((entry) => {
      const subset = posts.filter((post) => post.platform === entry.platform);
      const rate =
        subset.reduce((total, post) => total + engagementRate(post), 0) / (subset.length || 1);
      return { ...entry, rate };
    });

    const best = [...withRate].sort((a, b) => b.rate - a.rate)[0];
    const share = (best.posts / posts.length) * 100;

    if (share < 35) {
      insights.push({
        id: "channel",
        title: `${PLATFORM_META[best.platform]?.label ?? best.platform} is under-used`,
        body: `It earns your highest engagement rate at ${best.rate.toFixed(1)}%, yet accounts for only ${share.toFixed(0)}% of what you publish. Shifting two posts a week onto it is the lowest-effort gain available in this dataset.`,
        category: "Channel mix",
        tone: "brand",
        icon: Target,
        confidence: 0.86,
      });
    }
  }

  // 4. What the top posts have in common.
  const ranked = [...posts].sort((a, b) => weightedEngagement(b) - weightedEngagement(a));
  const top = ranked.slice(0, Math.max(3, Math.floor(posts.length * 0.1)));
  const median = ranked[Math.floor(ranked.length / 2)];
  const topAverage = top.reduce((total, post) => total + weightedEngagement(post), 0) / top.length;
  const multiple = median ? topAverage / Math.max(1, weightedEngagement(median)) : 0;

  insights.push({
    id: "top",
    title: `Your top ${top.length} posts outperform the median by ${multiple.toFixed(1)}x`,
    body: `"${top[0].title}" leads with ${formatCompact(weightedEngagement(top[0]))} weighted engagement at a ${engagementRate(top[0]).toFixed(1)}% rate. Concentration this steep usually means one repeatable format is carrying the account — identify it and run it deliberately rather than accidentally.`,
    category: "Content",
    tone: "info",
    icon: Award,
    confidence: 0.88,
  });

  // 5. Best day, computed from the data.
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayTotals = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));
  for (const post of posts) {
    const day = new Date(post.created_at).getDay();
    dayTotals[day].total += weightedEngagement(post);
    dayTotals[day].count += 1;
  }
  const dayAverages = dayTotals
    .map((entry, index) => ({
      day: dayNames[index],
      average: entry.count > 0 ? entry.total / entry.count : 0,
      count: entry.count,
    }))
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.average - a.average);

  if (dayAverages.length >= 2) {
    const bestDay = dayAverages[0];
    const worstDay = dayAverages[dayAverages.length - 1];
    const lift = worstDay.average > 0 ? bestDay.average / worstDay.average : 1;

    insights.push({
      id: "timing",
      title: `${bestDay.day} posts perform ${lift.toFixed(1)}x better than ${worstDay.day}`,
      body: `Averaged over ${bestDay.count} ${bestDay.day} posts, weighted engagement lands at ${formatCompact(Math.round(bestDay.average))} versus ${formatCompact(Math.round(worstDay.average))} on ${worstDay.day}. Move your most important post of the week onto ${bestDay.day}.`,
      category: "Timing",
      tone: "success",
      icon: Clock,
      confidence: 0.76,
    });
  }

  return insights;
}

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
