"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ExternalLink,
  Heart,
  LayoutGrid,
  List,
  MessageCircle,
  Repeat2,
  Search,
} from "lucide-react";
import {
  Badge,
  Card,
  DemoNotice,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { PLATFORM_META, useAnalytics } from "@/lib/use-analytics";
import { engagementRate, formatCompact, weightedEngagement } from "@/lib/analytics";
import type { Post } from "@/lib/types";

type SortKey = "recent" | "engagement" | "reach" | "rate";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "recent", label: "Most recent" },
  { key: "engagement", label: "Engagement" },
  { key: "reach", label: "Reach" },
  { key: "rate", label: "Engagement rate" },
];

export default function ContentPage() {
  const { posts, source, loading, notice } = useAnalytics();

  const [query, setQuery] = React.useState("");
  const [platform, setPlatform] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("recent");
  const [view, setView] = React.useState<"grid" | "table">("grid");

  const platforms = React.useMemo(
    () => [...new Set(posts.map((post) => post.platform))],
    [posts],
  );

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = posts.filter((post) => {
      if (platform !== "all" && post.platform !== platform) return false;
      if (!needle) return true;
      return (
        post.title.toLowerCase().includes(needle) ||
        post.content.toLowerCase().includes(needle)
      );
    });

    const sorters: Record<SortKey, (a: Post, b: Post) => number> = {
      recent: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      engagement: (a, b) => weightedEngagement(b) - weightedEngagement(a),
      reach: (a, b) => b.reach - a.reach,
      rate: (a, b) => engagementRate(b) - engagementRate(a),
    };

    return [...filtered].sort(sorters[sort]);
  }, [posts, query, platform, sort]);

  if (loading) {
    return (
      <>
        <div className="skeleton h-16 w-72 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Content"
        description="Every post you have published, with the numbers that decide what to make next."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {(
              [
                { key: "grid", icon: LayoutGrid, label: "Grid view" },
                { key: "table", icon: List, label: "Table view" },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setView(option.key)}
                aria-label={option.label}
                aria-pressed={view === option.key}
                className={`rounded-lg p-2 transition-colors ${
                  view === option.key
                    ? "bg-white/10 text-ink"
                    : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                <option.icon className="size-4" />
              </button>
            ))}
          </div>
        }
      />

      {source === "demo" && <DemoNotice notice={notice} />}

      {/* Controls ------------------------------------------------------ */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search captions and titles…"
            aria-label="Search content"
            className="input pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPlatform("all")}
            className={`chip transition-colors ${
              platform === "all" ? "!border-violet-400/40 !bg-violet-400/15 !text-violet-200" : ""
            }`}
          >
            All
          </button>
          {platforms.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPlatform(key)}
              className={`chip transition-colors ${
                platform === key ? "!border-violet-400/40 !bg-violet-400/15 !text-violet-200" : ""
              }`}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: PLATFORM_META[key]?.color }}
                aria-hidden
              />
              {PLATFORM_META[key]?.label ?? key}
            </button>
          ))}
        </div>

        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Sort posts"
            className="input cursor-pointer !py-2.5 pl-9 pr-8 text-sm"
          >
            {SORTS.map((option) => (
              <option key={option.key} value={option.key} className="bg-[#1a1d2e]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <p className="text-sm text-ink-faint">
        Showing <span className="tabular font-semibold text-ink">{visible.length}</span> of{" "}
        <span className="tabular">{posts.length}</span> posts
      </p>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search className="size-5" />}
            title="No posts match those filters"
            description="Try a different search term or clear the channel filter."
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <PostTable posts={visible} />
      )}
    </>
  );
}

function PostCard({ post }: { post: Post }) {
  const meta = PLATFORM_META[post.platform];
  const rate = engagementRate(post);

  return (
    <Card interactive lit className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="chip">
          <span className="size-1.5 rounded-full" style={{ background: meta?.color }} aria-hidden />
          {meta?.label ?? post.platform}
        </span>
        <time className="shrink-0 text-xs text-ink-faint" dateTime={post.created_at}>
          {new Date(post.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>

      <h3 className="mt-3.5 line-clamp-2 font-semibold leading-snug text-ink">{post.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{post.content}</p>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-faint">Engagement rate</span>
          <span className="tabular font-semibold text-ink">{rate.toFixed(1)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-[width] duration-700"
            /* 15% is treated as a full bar — above that is exceptional. */
            style={{ width: `${Math.min(100, (rate / 15) * 100)}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/8 pt-3.5 text-sm">
          <Metric icon={<Heart className="size-3.5" />} value={post.likes} tone="text-rose-300" />
          <Metric
            icon={<MessageCircle className="size-3.5" />}
            value={post.comments}
            tone="text-amber-300"
          />
          <Metric
            icon={<Repeat2 className="size-3.5" />}
            value={post.shares}
            tone="text-emerald-300"
          />
        </div>
      </div>
    </Card>
  );
}

function Metric({
  icon,
  value,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={tone}>{icon}</span>
      <span className="tabular text-ink-muted">{formatCompact(value)}</span>
    </div>
  );
}

function PostTable({ posts }: { posts: Post[] }) {
  return (
    <Card lit className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-5 py-3 font-medium sm:px-6">Post</th>
              <th className="px-3 py-3 font-medium">Channel</th>
              <th className="px-3 py-3 text-right font-medium">Likes</th>
              <th className="px-3 py-3 text-right font-medium">Comments</th>
              <th className="px-3 py-3 text-right font-medium">Shares</th>
              <th className="px-3 py-3 text-right font-medium">Reach</th>
              <th className="px-5 py-3 text-right font-medium sm:px-6">Rate</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const meta = PLATFORM_META[post.platform];
              return (
                <tr
                  key={post.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="max-w-[300px] px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink">{post.title}</p>
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open original post"
                          className="shrink-0 text-ink-faint hover:text-violet-300"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-ink-faint">
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
                    {formatCompact(post.likes)}
                  </td>
                  <td className="tabular px-3 py-3.5 text-right text-ink-muted">
                    {formatCompact(post.comments)}
                  </td>
                  <td className="tabular px-3 py-3.5 text-right text-ink-muted">
                    {formatCompact(post.shares)}
                  </td>
                  <td className="tabular px-3 py-3.5 text-right text-ink-muted">
                    {formatCompact(post.reach)}
                  </td>
                  <td className="px-5 py-3.5 text-right sm:px-6">
                    <Badge tone={engagementRate(post) >= 6 ? "success" : "neutral"}>
                      {engagementRate(post).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
