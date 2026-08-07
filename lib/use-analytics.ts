"use client";

import * as React from "react";
import { loadPosts } from "./data";
import { summarize } from "./analytics";
import { generateDemoPosts } from "./demo-data";
import type { ConnectedAccount, EngagementSummary, Post } from "./types";

export interface AnalyticsState {
  posts: Post[];
  summary: EngagementSummary;
  accounts: ConnectedAccount[];
  /** Where `posts` came from. */
  source: "meta" | "supabase" | "demo";
  loading: boolean;
  notice?: string;
  error?: string;
  refresh: () => void;
}

const EMPTY_SUMMARY = summarize([]);

/**
 * Single data entry point for every analytics page.
 *
 * Resolution order: live Meta accounts, then Supabase, then generated sample
 * data. Pages read `source` to decide whether to show the sample-data banner —
 * they never silently present simulated numbers as real ones.
 */
export function useAnalytics(): AnalyticsState {
  const [state, setState] = React.useState<Omit<AnalyticsState, "refresh">>({
    posts: [],
    summary: EMPTY_SUMMARY,
    accounts: [],
    source: "demo",
    loading: true,
  });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      // 1. Live Instagram / Facebook data, if an account is connected.
      try {
        const res = await fetch("/api/meta/media", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.connected && Array.isArray(json.posts) && json.posts.length > 0) {
            const accountsRes = await fetch("/api/meta/accounts", { cache: "no-store" })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null);

            if (cancelled) return;
            setState({
              posts: json.posts as Post[],
              summary: summarize(json.posts as Post[]),
              accounts: accountsRes?.accounts ?? [],
              source: "meta",
              loading: false,
              notice: Array.isArray(json.errors) ? json.errors.join(" · ") : undefined,
            });
            return;
          }
        }
      } catch {
        // Not connected, or the endpoint is unavailable — fall through.
      }

      // 2. Supabase, or 3. generated sample data.
      try {
        const result = await loadPosts();
        if (cancelled) return;
        setState({
          posts: result.data,
          summary: summarize(result.data),
          accounts: [],
          source: result.source === "live" ? "supabase" : "demo",
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
