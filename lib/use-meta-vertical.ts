"use client";

import * as React from "react";
import type { ConnectedAccount, Post } from "./types";

export interface MetaVerticalState {
  configured: boolean;
  connected: boolean;
  accounts: ConnectedAccount[];
  posts: Post[];
  loading: boolean;
  notice?: string;
  refresh: () => void;
}

/**
 * Powers the Instagram and Facebook vertical pages.
 *
 * Unlike YouTube there is no ad-hoc "look up any account" mode here — Meta
 * exposes no public endpoint for someone else's Page or Instagram Business
 * insights, only for accounts you administer via OAuth. So this hook only
 * ever reflects what /connections has linked, filtered down to one platform.
 *
 * Posts aren't tagged with which specific connected account produced them, so
 * with two Pages of the same platform connected this shows their combined
 * feed rather than a per-account split — a fair MVP limitation, not a bug.
 */
export function useMetaVertical(platform: "instagram" | "facebook"): MetaVerticalState {
  const [state, setState] = React.useState<Omit<MetaVerticalState, "refresh">>({
    configured: false,
    connected: false,
    accounts: [],
    posts: [],
    loading: true,
  });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const [accountsRes, mediaRes] = await Promise.all([
          fetch("/api/meta/accounts", { cache: "no-store" }),
          fetch("/api/meta/media", { cache: "no-store" }),
        ]);
        const accountsJson = await accountsRes.json();
        const mediaJson = await mediaRes.json();
        if (cancelled) return;

        const accounts: ConnectedAccount[] = Array.isArray(accountsJson.accounts)
          ? accountsJson.accounts.filter((a: ConnectedAccount) => a.platform === platform)
          : [];
        const posts: Post[] = Array.isArray(mediaJson.posts)
          ? mediaJson.posts.filter((p: Post) => p.platform === platform)
          : [];

        setState({
          configured: Boolean(accountsJson.configured),
          connected: accountsJson.connected && accounts.length > 0,
          accounts,
          posts,
          loading: false,
          notice: Array.isArray(mediaJson.errors) ? mediaJson.errors.join(" · ") : undefined,
        });
      } catch {
        if (cancelled) return;
        setState({
          configured: false,
          connected: false,
          accounts: [],
          posts: [],
          loading: false,
          notice: "Could not reach the account service.",
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [platform, nonce]);

  const refresh = React.useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, refresh };
}
