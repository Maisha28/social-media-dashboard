"use client";

import * as React from "react";
import type { Post } from "./types";
import type { YoutubeChannel } from "./youtube";

export interface YoutubeVerticalState {
  channel: YoutubeChannel | null;
  posts: Post[];
  loading: boolean;
  error: string;
  /** True when the channel currently shown is the one saved via /connections. */
  isPersisted: boolean;
  connecting: boolean;
  search: (handle: string) => Promise<void>;
  /** Saves the currently-viewed channel as the persistent connection. */
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Powers the YouTube vertical page.
 *
 * On load, shows whatever channel is already connected via /connections, if
 * any. `search` swaps the view to any public channel ad hoc, without touching
 * that saved connection — `connect` promotes the currently-viewed channel into
 * the persisted one, so a judge-facing demo can search, like what they see,
 * then make it "the" connected channel in one click.
 */
export function useYoutubeVertical(): YoutubeVerticalState {
  const [channel, setChannel] = React.useState<YoutubeChannel | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [isPersisted, setIsPersisted] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  const loadPersisted = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const accountsRes = await fetch("/api/youtube/accounts", { cache: "no-store" });
      const accounts = await accountsRes.json();

      if (accounts.connected && accounts.channel) {
        const mediaRes = await fetch("/api/youtube/media", { cache: "no-store" });
        const media = await mediaRes.json();
        setChannel(accounts.channel);
        setPosts(Array.isArray(media.posts) ? media.posts : []);
        setIsPersisted(true);
      } else {
        setChannel(null);
        setPosts([]);
        setIsPersisted(false);
      }
    } catch {
      setError("Could not load your connected channel.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPersisted();
  }, [loadPersisted]);

  const search = React.useCallback(async (handle: string) => {
    const trimmed = handle.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/youtube?channel=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not find that channel.");
        return;
      }
      setChannel(json.channel);
      setPosts(Array.isArray(json.posts) ? json.posts : []);
      setIsPersisted(false);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = React.useCallback(async () => {
    if (!channel) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/youtube/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: channel.id }),
      });
      if (res.ok) setIsPersisted(true);
    } finally {
      setConnecting(false);
    }
  }, [channel]);

  const disconnect = React.useCallback(async () => {
    setConnecting(true);
    try {
      await fetch("/api/youtube/disconnect", { method: "POST" });
      setChannel(null);
      setPosts([]);
      setIsPersisted(false);
    } finally {
      setConnecting(false);
    }
  }, []);

  return { channel, posts, loading, error, isPersisted, connecting, search, connect, disconnect };
}
