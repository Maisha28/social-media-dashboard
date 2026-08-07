"use client";

import { getSupabase } from "./supabase";
import { generateDemoAccounts, generateDemoInsights, generateDemoPosts } from "./demo-data";
import type { ConnectedAccount, Insight, PlatformId, Post } from "./types";

export type DataSource = "live" | "demo";

export interface LoadResult<T> {
  data: T;
  source: DataSource;
  /** Populated when a live fetch was attempted and failed. */
  notice?: string;
}

function normalisePlatform(value: unknown): PlatformId {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("instagram") || key === "ig") return "instagram";
  if (key.includes("facebook") || key === "fb") return "facebook";
  if (key.includes("youtube") || key === "yt") return "youtube";
  if (key.includes("twitter") || key === "x") return "twitter";
  if (key.includes("linkedin")) return "linkedin";
  return "general";
}

function normalisePost(row: Record<string, unknown>, index: number): Post {
  const likes = Number(row.likes) || 0;
  const comments = Number(row.comments) || 0;
  const shares = Number(row.shares) || 0;
  const reach = Number(row.reach) || Number(row.impressions) || 0;

  return {
    id: String(row.id ?? `row-${index}`),
    title: String(row.title ?? row.caption ?? `Post ${index + 1}`),
    content: String(row.content ?? row.caption ?? ""),
    platform: normalisePlatform(row.platform),
    likes,
    comments,
    shares,
    // Without reach we cannot compute a rate, so approximate from engagement.
    // Flagged in the UI as an estimate wherever it materially matters.
    reach: reach || Math.round((likes + comments * 2 + shares * 3) * 18),
    impressions: Number(row.impressions) || 0,
    thumbnail: (row.thumbnail as string) || undefined,
    permalink: (row.permalink as string) || undefined,
    created_at: String(row.created_at ?? row.posted_at ?? new Date().toISOString()),
  };
}

/**
 * Turns a raw fetch/Postgrest failure into something a non-engineer can act on.
 * "TypeError: Failed to fetch" tells the user nothing about what to do next.
 */
function explain(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/failed to fetch|networkerror|load failed|enotfound|getaddrinfo/i.test(message)) {
    return "The configured Supabase project could not be reached — it has most likely been paused or deleted. Showing sample data in the meantime.";
  }
  if (/jwt|api key|invalid.*key|unauthorized/i.test(message)) {
    return "Supabase rejected the API key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY. Showing sample data in the meantime.";
  }
  if (/relation .* does not exist|could not find the table|PGRST205/i.test(message)) {
    return "Connected to Supabase, but the posts table does not exist yet. Run the setup SQL in supabase/schema.sql. Showing sample data in the meantime.";
  }
  return `${message} Showing sample data in the meantime.`;
}

export async function loadPosts(): Promise<LoadResult<Post[]>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: generateDemoPosts(), source: "demo" };
  }

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return {
        data: generateDemoPosts(),
        source: "demo",
        notice: "Connected to Supabase, but the posts table is empty. Showing sample data.",
      };
    }

    return { data: data.map(normalisePost), source: "live" };
  } catch (error) {
    return { data: generateDemoPosts(), source: "demo", notice: explain(error) };
  }
}

export async function loadInsights(): Promise<LoadResult<Insight[]>> {
  const supabase = getSupabase();
  if (!supabase) return { data: generateDemoInsights(), source: "demo" };

  try {
    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { data: generateDemoInsights(), source: "demo" };

    return {
      source: "live",
      data: data.map((row: Record<string, unknown>, i: number) => ({
        id: String(row.id ?? i),
        text: String(row.text ?? row.insight_text ?? row.message ?? ""),
        category: String(row.category ?? "General"),
        confidence: Number(row.confidence ?? row.confidence_score ?? 0.8),
        created_at: String(row.created_at ?? row.generated_at ?? new Date().toISOString()),
      })),
    };
  } catch {
    return { data: generateDemoInsights(), source: "demo" };
  }
}

export async function loadAccounts(): Promise<LoadResult<ConnectedAccount[]>> {
  try {
    const res = await fetch("/api/meta/accounts", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.connected && Array.isArray(json.accounts) && json.accounts.length > 0) {
        return { data: json.accounts as ConnectedAccount[], source: "live" };
      }
    }
  } catch {
    // Fall through to demo accounts.
  }
  return { data: generateDemoAccounts(), source: "demo" };
}
