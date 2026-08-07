"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bot,
  CornerDownLeft,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Printer,
  Repeat2,
  Sparkles,
  User,
} from "lucide-react";
import { Badge, Card, EmptyState, SectionHeading, StatTile } from "@/components/ui";
import { ChartFrame, ChartTooltip, axisProps } from "@/components/charts";
import {
  ENGAGEMENT_FORMULA,
  engagementRate,
  formatCompact,
  linearForecast,
  summarize,
  toSeries,
  weightedEngagement,
} from "@/lib/analytics";
import { deriveInsights } from "@/lib/insights";
import type { Post } from "@/lib/types";

interface VerticalWorkspaceProps {
  platformLabel: string;
  accountLabel: string;
  posts: Post[];
  accent?: string;
}

/**
 * Everything a single platform+account needs: engagement overview, AI
 * insights, a forecast, an Ask AI panel and a printable report — all scoped
 * to just the `posts` passed in. Reused by the YouTube, Instagram and
 * Facebook vertical pages so "pick a platform, get every feature" holds for
 * all three without tripling the implementation.
 */
export default function VerticalWorkspace({
  platformLabel,
  accountLabel,
  posts,
  accent = "var(--chart-1)",
}: VerticalWorkspaceProps) {
  const summary = React.useMemo(() => summarize(posts), [posts]);
  const series = React.useMemo(() => toSeries(posts, 30), [posts]);
  const insights = React.useMemo(() => deriveInsights(posts), [posts]);
  const topPosts = React.useMemo(
    () => [...posts].sort((a, b) => weightedEngagement(b) - weightedEngagement(a)).slice(0, 8),
    [posts],
  );

  const forecast = React.useMemo(() => {
    const values = series.map((point) => point.engagement);
    const model = linearForecast(values, 14);
    const lastDate = new Date();
    const projected = model.forecast.map((value, index) => {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + index + 1);
      return {
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        actual: undefined as number | undefined,
        forecast: value,
      };
    });
    const actual = series.map((point) => ({
      label: point.label,
      actual: point.engagement,
      forecast: undefined as number | undefined,
    }));
    return [...actual, ...projected];
  }, [series]);

  const [generatedAt, setGeneratedAt] = React.useState("");
  React.useEffect(() => {
    setGeneratedAt(new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }));
  }, []);

  if (posts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="No data yet"
          description={`Once ${accountLabel || "an account"} has posts to read, insights, forecasts and a report will appear here automatically.`}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview ----------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Reach"
          value={summary.reach}
          accent="cyan"
          format={formatCompact}
          icon={<Eye className="size-4.5" />}
        />
        <StatTile
          label="Likes"
          value={summary.likes}
          accent="rose"
          format={formatCompact}
          icon={<Heart className="size-4.5" />}
        />
        <StatTile
          label="Comments"
          value={summary.comments}
          accent="amber"
          format={formatCompact}
          icon={<MessageCircle className="size-4.5" />}
        />
        <StatTile
          label="Shares"
          value={summary.shares}
          accent="emerald"
          format={formatCompact}
          icon={<Repeat2 className="size-4.5" />}
        />
      </div>

      <Card lit className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading title="Engagement trend" description="Last 30 days." />
          <Badge tone="brand">
            Score {summary.score}/100 · {summary.grade}
          </Badge>
        </div>
        <ChartFrame height={260} className="mt-5">
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${platformLabel}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axisProps} minTickGap={28} />
              <YAxis {...axisProps} tickFormatter={formatCompact} width={52} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
              <Area
                type="monotone"
                dataKey="engagement"
                name="Engagement"
                stroke={accent}
                strokeWidth={2.5}
                fill={`url(#grad-${platformLabel})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
      </Card>

      {/* AI insights ---------------------------------------------------- */}
      <Card lit className="p-5 sm:p-6">
        <SectionHeading
          title="AI insights"
          description={`Derived from ${accountLabel}'s own ${posts.length} posts — nothing generic.`}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div key={insight.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-violet-300" />
                  <Badge tone={insight.tone}>{insight.category}</Badge>
                </div>
                <p className="mt-2.5 text-sm font-semibold leading-snug text-ink">{insight.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{insight.body}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Forecast --------------------------------------------------------- */}
      <Card lit className="p-5 sm:p-6">
        <SectionHeading title="Forecast" description="14-day linear projection of engagement." />
        <ChartFrame height={220} className="mt-4">
          <ResponsiveContainer>
            <BarChart data={forecast} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axisProps} minTickGap={40} />
              <YAxis {...axisProps} tickFormatter={formatCompact} width={50} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
              <Bar dataKey="actual" name="Observed" fill={accent} radius={[4, 4, 0, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </Card>

      {/* Ask AI ------------------------------------------------------------ */}
      <VerticalAskAi platformLabel={platformLabel} accountLabel={accountLabel} posts={posts} />

      {/* Printable report --------------------------------------------------- */}
      <Card lit id={`report-${platformLabel}`} className="p-5 sm:p-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            title="Report"
            description="A client-ready summary of this account. Print it to save as PDF."
          />
          <button type="button" onClick={() => window.print()} className="btn btn-primary !py-2 text-xs">
            <Printer className="size-3.5" />
            Print / PDF
          </button>
        </div>

        <div className="mt-4 border-t border-white/8 pt-4">
          <h3 className="text-base font-semibold text-ink">
            {platformLabel} performance — {accountLabel}
          </h3>
          {generatedAt && <p className="mt-0.5 text-xs text-ink-faint">Generated {generatedAt}</p>}

          <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8 sm:grid-cols-4">
            {[
              { label: "Reach", value: formatCompact(summary.reach) },
              { label: "Weighted engagement", value: formatCompact(summary.weighted) },
              { label: "Engagement rate", value: `${summary.rate.toFixed(2)}%` },
              { label: "Score", value: `${summary.score}/100` },
            ].map((item) => (
              <div key={item.label} className="bg-[oklch(0.19_0.024_268)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-wider text-ink-faint">{item.label}</p>
                <p className="tabular mt-1.5 text-lg font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03] text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Post</th>
                  <th className="px-4 py-2.5 text-right font-medium">Reach</th>
                  <th className="px-4 py-2.5 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post, index) => (
                  <tr key={post.id} className="border-b border-white/5 last:border-0">
                    <td className="tabular px-4 py-2.5 text-ink-faint">{index + 1}</td>
                    <td className="max-w-[280px] truncate px-4 py-2.5 text-ink">{post.title}</td>
                    <td className="tabular px-4 py-2.5 text-right text-ink-muted">
                      {formatCompact(post.reach)}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right font-medium text-emerald-300">
                      {engagementRate(post).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 font-mono text-[11px] text-ink-faint">
            engagement rate = {ENGAGEMENT_FORMULA}
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   Embedded Ask AI, scoped to this vertical's posts
   ========================================================================== */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

let msgCounter = 0;
function nextMsgId() {
  msgCounter += 1;
  return `vw-${msgCounter}`;
}

function VerticalAskAi({
  platformLabel,
  accountLabel,
  posts,
}: {
  platformLabel: string;
  accountLabel: string;
  posts: Post[];
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const digest = React.useMemo(() => {
    const summary = summarize(posts);
    const top = [...posts]
      .sort((a, b) => weightedEngagement(b) - weightedEngagement(a))
      .slice(0, 5)
      .map((post) => ({
        title: post.title,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        reach: post.reach,
        date: post.created_at.slice(0, 10),
      }));
    return { platform: platformLabel, account: accountLabel, summary, topPosts: top };
  }, [posts, platformLabel, accountLabel]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    setInput("");
    setMessages((current) => [...current, { id: nextMsgId(), role: "user", text: trimmed }]);
    setSending(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `[About my ${platformLabel} account "${accountLabel}" specifically] ${trimmed}`,
          analytics: digest,
        }),
      });
      const json = await res.json();
      const text = res.ok ? json.answer : (json.error ?? "The assistant is unavailable right now.");
      setMessages((current) => [...current, { id: nextMsgId(), role: "assistant", text }]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: nextMsgId(), role: "assistant", text: "Network error. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card lit className="no-print p-5 sm:p-6">
      <SectionHeading
        title="Ask about this account"
        description={`Scoped to ${accountLabel}'s data only.`}
      />

      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-white/8 bg-white/[0.02] p-4">
        {messages.length === 0 && (
          <p className="text-sm text-ink-faint">
            e.g. &ldquo;What should I post next on {platformLabel}?&rdquo;
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-lg ${
                message.role === "assistant" ? "bg-violet-400/15 text-violet-200" : "bg-white/8 text-ink-muted"
              }`}
            >
              {message.role === "assistant" ? <Sparkles className="size-3" /> : <User className="size-3" />}
            </span>
            <p
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                message.role === "assistant"
                  ? "bg-white/5 text-ink"
                  : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-ink-faint">
            <Loader2 className="size-3.5 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Ask anything about ${accountLabel}…`}
            aria-label="Ask about this account"
            className="input py-2.5 pr-9 text-sm"
          />
          <CornerDownLeft className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
        </div>
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="btn btn-primary shrink-0 !py-2.5 text-xs"
        >
          <Bot className="size-3.5" />
          Ask
        </button>
      </form>
    </Card>
  );
}
