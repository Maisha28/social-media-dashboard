import { serverEnv } from "./env";
import type { ConnectedAccount, Post } from "./types";

/**
 * YouTube Data API v3 helpers.
 *
 * Unlike Instagram/Facebook, channel and video statistics are public data —
 * Google exposes them to any API key holder, for any channel, with no OAuth
 * and no relationship to the channel owner required. So "connecting" a
 * YouTube channel here just means telling the app which public channel to
 * read, not authenticating as its owner.
 */

const API = "https://www.googleapis.com/youtube/v3";
const CHANNEL_ID_RE = /^UC[a-zA-Z0-9_-]{22}$/;

async function apiGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const apiKey = serverEnv.youtubeKey;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not configured on this deployment.");

  const url = `${API}/${path}?${new URLSearchParams({ ...params, key: apiKey })}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok || json.error) {
    const message = json?.error?.message ?? `YouTube API request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

interface RawChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
    customUrl?: string;
  };
  statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

export interface YoutubeChannel {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  uploadsPlaylistId?: string;
}

function toChannel(raw: RawChannel): YoutubeChannel {
  return {
    id: raw.id,
    title: raw.snippet.title,
    handle: raw.snippet.customUrl ?? raw.id,
    thumbnail: raw.snippet.thumbnails?.medium?.url ?? raw.snippet.thumbnails?.default?.url,
    subscribers: Number(raw.statistics.subscriberCount ?? 0),
    totalViews: Number(raw.statistics.viewCount ?? 0),
    videoCount: Number(raw.statistics.videoCount ?? 0),
    uploadsPlaylistId: raw.contentDetails?.relatedPlaylists?.uploads,
  };
}

/** Pulls the channel id, @handle, or username out of a pasted URL, handle, or raw id. */
function parseChannelInput(input: string): { id?: string; handle?: string; username?: string } {
  let value = input.trim();

  // A full URL — pull out the meaningful segment.
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "channel" && parts[1]) return { id: parts[1] };
      if (parts[0]?.startsWith("@")) return { handle: parts[0].slice(1) };
      if (parts[0] === "c" && parts[1]) return { handle: parts[1] };
      if (parts[0] === "user" && parts[1]) return { username: parts[1] };
      if (parts[0]) return { handle: parts[0].replace(/^@/, "") };
    } catch {
      // fall through to plain-string handling below
    }
  }

  value = value.replace(/^@/, "");
  if (CHANNEL_ID_RE.test(value)) return { id: value };
  return { handle: value };
}

/** Resolves a handle, channel URL, username, or raw channel id to full channel info. */
export async function resolveChannel(input: string): Promise<YoutubeChannel> {
  const parsed = parseChannelInput(input);
  const part = "snippet,statistics,contentDetails";

  let data: { items?: RawChannel[] };
  if (parsed.id) {
    data = await apiGet("channels", { part, id: parsed.id });
  } else if (parsed.handle) {
    data = await apiGet("channels", { part, forHandle: parsed.handle });
    // Older channels may not have migrated to @handles — fall back to the
    // legacy username lookup before giving up.
    if (!data.items?.length) {
      data = await apiGet("channels", { part, forUsername: parsed.handle });
    }
  } else {
    data = await apiGet("channels", { part, forUsername: parsed.username! });
  }

  const channel = data.items?.[0];
  if (!channel) {
    throw new Error(
      `No YouTube channel found for "${input}". Check the @handle or paste the full channel URL.`,
    );
  }
  return toChannel(channel);
}

interface RawVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails?: { medium?: { url?: string } };
  };
  statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
}

export async function fetchChannelVideos(channel: YoutubeChannel, limit = 25): Promise<Post[]> {
  if (!channel.uploadsPlaylistId) return [];

  const playlist = await apiGet<{ items?: Array<{ contentDetails?: { videoId?: string } }> }>(
    "playlistItems",
    {
      part: "contentDetails",
      playlistId: channel.uploadsPlaylistId,
      maxResults: String(Math.min(limit, 50)),
    },
  );

  const videoIds = (playlist.items ?? [])
    .map((item) => item.contentDetails?.videoId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0) return [];

  const videos = await apiGet<{ items?: RawVideo[] }>("videos", {
    part: "snippet,statistics",
    id: videoIds.join(","),
  });

  return (videos.items ?? []).map((video): Post => {
    const views = Number(video.statistics.viewCount ?? 0);
    return {
      id: video.id,
      title: video.snippet.title,
      content: video.snippet.description?.slice(0, 280) ?? "",
      platform: "youtube",
      likes: Number(video.statistics.likeCount ?? 0),
      comments: Number(video.statistics.commentCount ?? 0),
      // The public Data API exposes no share count for videos.
      shares: 0,
      reach: views,
      impressions: views,
      thumbnail: video.snippet.thumbnails?.medium?.url,
      permalink: `https://www.youtube.com/watch?v=${video.id}`,
      created_at: video.snippet.publishedAt,
    };
  });
}

export function channelToAccount(channel: YoutubeChannel, connectedAt: string): ConnectedAccount {
  return {
    id: channel.id,
    platform: "youtube",
    username: channel.handle,
    displayName: channel.title,
    avatarUrl: channel.thumbnail,
    followers: channel.subscribers,
    connectedAt,
  };
}

/** Shape persisted in the sp_youtube cookie. Public data only — no token to protect. */
export interface YoutubeConnection {
  channel: YoutubeChannel;
  connectedAt: string;
}
