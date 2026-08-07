"use client";

import * as React from "react";
import { loadPosts } from "./data";
import { summarize } from "./analytics";
import { generateDemoPosts } from "./demo-data";
import type { ConnectedAccount, EngagementSummary, PlatformId, Post } from "./types";

export interface AnalyticsState {
  posts: Post[];
  summary: EngagementSummary;
  accounts: ConnectedAccount[];
  /** Where `posts` came from. "live" means at least one real account is connected. */
  source: "live" | "supabase" | "demo";
  /** Which connected platforms actually contributed posts, when source is "live". */
  livePlatforms: PlatformId[];
  loading: boolean;
  notice?: string;
  error?: string;
  refresh: () => void;
}

const EMPTY_SUMMARY = summarize([]);

async function safeJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * Single data entry point for every analytics page.
 *
 * Resolution order: any connected real account (Instagram/Facebook via Meta,
 * YouTube via its public API — merged together if both are connected), then
 * Supabase, then generated sample data. Pages read `source` to decide whether
 * to show the sample-data banner — real data is never silently blended with
 * simulated numbers without saying so.
 */
export function useAnalytics(): AnalyticsState {
  const [state, setState] = React.useState<Omit<AnalyticsState, "refresh">>({
    posts: [],
    summary: EMPTY_SUMMARY,
    accounts: [],
    source: "demo",
    livePlatforms: [],
    loading: true,
  });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      // 1. Every connected real account, fetched in parallel and merged.
      const [metaMedia, metaAccounts, youtubeMedia, youtubeAccounts] = await Promise.all([
        safeJson("/api/meta/media"),
        safeJson("/api/meta/accounts"),
        safeJson("/api/youtube/media"),
        safeJson("/api/youtube/accounts"),
      ]);

      const livePosts: Post[] = [];
      const liveAccounts: ConnectedAccount[] = [];
      const liveErrors: string[] = [];
      const livePlatforms = new Set<PlatformId>();

      if (metaMedia?.connected && Array.isArray(metaMedia.posts) && metaMedia.posts.length > 0) {
        livePosts.push(...(metaMedia.posts as Post[]));
        (metaMedia.posts as Post[]).forEach((p) => livePlatforms.add(p.platform));
        if (Array.isArray(metaMedia.errors)) liveErrors.push(...metaMedia.errors);
      }
      if (metaAccounts?.connected && Array.isArray(metaAccounts.accounts)) {
        liveAccounts.push(...(metaAccounts.accounts as ConnectedAccount[]));
      }

      if (
        youtubeMedia?.connected &&
        Array.isArray(youtubeMedia.posts) &&
        youtubeMedia.posts.length > 0
      ) {
        livePosts.push(...(youtubeMedia.posts as Post[]));
        livePlatforms.add("youtube");
        if (Array.isArray(youtubeMedia.errors)) liveErrors.push(...youtubeMedia.errors);
      }
      if (youtubeAccounts?.connected && Array.isArray(youtubeAccounts.accounts)) {
        liveAccounts.push(...(youtubeAccounts.accounts as ConnectedAccount[]));
      }

      if (livePosts.length > 0) {
        livePosts.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        if (cancelled) return;
        setState({
          posts: livePosts,
          summary: summarize(livePosts),
          accounts: liveAccounts,
          source: "live",
          livePlatforms: [...livePlatforms],
          loading: false,
          notice: liveErrors.length > 0 ? liveErrors.join(" · ") : undefined,
        });
        return;
      }

      // 2. Supabase, or 3. generated sample data.
      try {
        const result = await loadPosts();
        if (cancelled) return;
        setState({
          posts: result.data,
          summary: summarize(result.data),
          accounts: liveAccounts,
          source: result.source === "live" ? "supabase" : "demo",
          livePlatforms: [],
          loading: false,
          notice: result.notice,
        });
      } catch (error) {
        if (cancelled) return;
        const fallback = generateDemoPosts();
        setState({
          posts: fallback,
          summary: summarize(fallback),
          accounts: [],
          source: "demo",
          livePlatforms: [],
          loading: false,
          error: error instanceof Error ? error.message : "Could not load analytics.",
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refresh = React.useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, refresh };
}

export const PLATFORM_META: Record<
  string,
  { label: string; color: string; gradient: string }
> = {
  instagram: {
    label: "Instagram",
    color: "var(--chart-5)",
    gradient: "from-fuchsia-500 to-orange-400",
  },
  facebook: { label: "Facebook", color: "var(--chart-1)", gradient: "from-blue-500 to-indigo-500" },
  youtube: { label: "YouTube", color: "var(--chart-6)", gradient: "from-red-500 to-rose-500" },
  twitter: { label: "X / Twitter", color: "var(--chart-2)", gradient: "from-sky-400 to-cyan-400" },
  linkedin: { label: "LinkedIn", color: "var(--chart-3)", gradient: "from-teal-400 to-emerald-400" },
  general: { label: "Other", color: "var(--chart-4)", gradient: "from-amber-400 to-yellow-400" },
};

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
