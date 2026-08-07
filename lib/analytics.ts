import type { EngagementSummary, Post, SeriesPoint } from "./types";

/**
 * Weighting rationale: a comment costs the viewer more effort than a like, and
 * a share puts their own reputation behind the post. The 1/2/3 split is the
 * same one used across every page — keep it here only.
 */
export const WEIGHTS = { likes: 1, comments: 2, shares: 3 } as const;

export const ENGAGEMENT_FORMULA =
  "(likes x 1 + comments x 2 + shares x 3) / reach x 100";

export function weightedEngagement(post: Pick<Post, "likes" | "comments" | "shares">) {
  return (
    (post.likes || 0) * WEIGHTS.likes +
    (post.comments || 0) * WEIGHTS.comments +
    (post.shares || 0) * WEIGHTS.shares
  );
}

/**
 * Engagement rate for a single post, as a percentage of the people it reached.
 * Falls back to impressions, then to a nominal denominator so that a post with
 * no reach data still lands somewhere sane instead of dividing by zero.
 */
export function engagementRate(post: Post): number {
  const denominator = post.reach || post.impressions || 0;
  if (denominator <= 0) return 0;
  return (weightedEngagement(post) / denominator) * 100;
}

function gradeFor(rate: number): EngagementSummary["grade"] {
  if (rate >= 12) return "Exceptional";
  if (rate >= 7) return "Strong";
  if (rate >= 4) return "Healthy";
  if (rate >= 2) return "Average";
  return "Needs work";
}

/**
 * Maps an engagement rate onto a 0-100 score. Industry benchmarks cluster
 * between 1% and 6%, so the curve is deliberately compressed at the top: 12%+
 * saturates rather than letting one viral post peg the gauge forever.
 */
function scoreFor(rate: number): number {
  if (rate <= 0) return 0;
  const score = 100 * (1 - Math.exp(-rate / 4.5));
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function summarize(posts: Post[]): EngagementSummary {
  if (!posts || posts.length === 0) {
    return {
      totalPosts: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      weighted: 0,
      perPost: 0,
      rate: 0,
      score: 0,
      grade: "No data",
    };
  }

  let likes = 0;
  let comments = 0;
  let shares = 0;
  let reach = 0;
  let impressions = 0;

  for (const post of posts) {
    likes += Number(post.likes) || 0;
    comments += Number(post.comments) || 0;
    shares += Number(post.shares) || 0;
    reach += Number(post.reach) || 0;
    impressions += Number(post.impressions) || 0;
  }

  const weighted = likes * WEIGHTS.likes + comments * WEIGHTS.comments + shares * WEIGHTS.shares;
  const denominator = reach || impressions;
  const rate = denominator > 0 ? (weighted / denominator) * 100 : 0;

  return {
    totalPosts: posts.length,
    likes,
    comments,
    shares,
    reach,
    impressions,
    weighted,
    perPost: Math.round(weighted / posts.length),
    rate: Number(rate.toFixed(2)),
    score: scoreFor(rate),
    grade: gradeFor(rate),
  };
}

/** Groups posts into a daily time series covering the last `days` days. */
export function toSeries(posts: Post[], days = 30): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      engagement: 0,
    });
  }

  for (const post of posts) {
    const key = String(post.created_at).slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.likes += post.likes || 0;
    bucket.comments += post.comments || 0;
    bucket.shares += post.shares || 0;
    bucket.reach += post.reach || 0;
    bucket.engagement += weightedEngagement(post);
  }

  return [...buckets.values()];
}

export function byPlatform(posts: Post[]) {
  const map = new Map<string, { platform: string; posts: number; engagement: number; reach: number }>();
  for (const post of posts) {
    const key = post.platform || "general";
    const entry = map.get(key) ?? { platform: key, posts: 0, engagement: 0, reach: 0 };
    entry.posts += 1;
    entry.engagement += weightedEngagement(post);
    entry.reach += post.reach || 0;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.engagement - a.engagement);
}

/** Least-squares fit over an ordered numeric series. */
export function linearForecast(values: number[], periodsAhead: number) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, predict: () => values[0] ?? 0, forecast: [] as number[] };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  values.forEach((y, i) => {
    const x = i + 1;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const predict = (x: number) => slope * x + intercept;

  const forecast: number[] = [];
  for (let i = 1; i <= periodsAhead; i++) {
    forecast.push(Math.max(0, predict(n + i)));
  }

  return { slope, intercept, predict, forecast };
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(0)}K`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(value));
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
