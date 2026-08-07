import {
  Award,
  Clock,
  Flame,
  Lightbulb,
  MessageCircle,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  byPlatform,
  engagementRate,
  formatCompact,
  percentChange,
  toSeries,
  weightedEngagement,
} from "./analytics";
import type { Post } from "./types";
import { PLATFORM_META } from "./use-analytics";

export interface GeneratedInsight {
  id: string;
  title: string;
  body: string;
  category: string;
  tone: "success" | "warning" | "info" | "brand";
  icon: LucideIcon;
  confidence: number;
}

/**
 * Derives insights from the actual dataset rather than printing fixed strings.
 *
 * Everything here cites a number the caller can verify elsewhere in the app —
 * no claim is hard-coded independent of what the data says. Shared by the
 * cross-platform AI Insights page and every single-platform vertical page, so
 * "insights for just my YouTube channel" and "insights across everything" run
 * through identical logic.
 */
export function deriveInsights(posts: Post[]): GeneratedInsight[] {
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
  // Only meaningful when the dataset spans more than one platform.
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

export const INSIGHTS_ICON_FALLBACK = Flame;
