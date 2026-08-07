import { SITE_URL, serverEnv } from "./env";
import type { ConnectedAccount, Post } from "./types";

/**
 * Meta Graph API integration.
 *
 * Why OAuth and not username + password: Meta exposes no endpoint that accepts
 * a user's password, and sending one to a third party violates their Platform
 * Terms (and breaks the moment 2FA or a login checkpoint is involved). The
 * supported flow is Facebook Login — the user authenticates on Meta's own
 * domain and we receive a scoped access token.
 *
 * Reading Instagram data requires an Instagram *Business* or *Creator* account
 * linked to a Facebook Page. Personal Instagram accounts cannot expose
 * insights through any API.
 */

export const GRAPH_VERSION = (process.env.META_API_VERSION ?? "v23.0").trim();
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

/** Permissions requested at login. Each one must be approved in App Review. */
export const META_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "read_insights",
  "instagram_basic",
  "instagram_manage_insights",
].join(",");

export function metaRedirectUri(): string {
  return `${SITE_URL}/api/auth/meta/callback`;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: serverEnv.metaAppId,
    redirect_uri: metaRedirectUri(),
    state,
    response_type: "code",
    scope: META_SCOPES,
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params}`;
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${GRAPH}/${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.error) {
    const message = json?.error?.message ?? `Graph API request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

/** Exchanges the one-time `code` for a short-lived user access token. */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const data = await graphGet<{ access_token: string }>("oauth/access_token", {
    client_id: serverEnv.metaAppId,
    client_secret: serverEnv.metaAppSecret,
    redirect_uri: metaRedirectUri(),
    code,
  });
  return data.access_token;
}

/**
 * Upgrades a short-lived token (~1 hour) to a long-lived one (~60 days).
 * Without this step every connection would silently break within the hour.
 */
export async function exchangeForLongLivedToken(shortToken: string): Promise<{
  token: string;
  expiresIn: number;
}> {
  const data = await graphGet<{ access_token: string; expires_in?: number }>(
    "oauth/access_token",
    {
      grant_type: "fb_exchange_token",
      client_id: serverEnv.metaAppId,
      client_secret: serverEnv.metaAppSecret,
      fb_exchange_token: shortToken,
    },
  );
  return { token: data.access_token, expiresIn: data.expires_in ?? 60 * 60 * 24 * 60 };
}

interface RawPage {
  id: string;
  name: string;
  access_token: string;
  followers_count?: number;
  fan_count?: number;
  picture?: { data?: { url?: string } };
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
    followers_count?: number;
    profile_picture_url?: string;
  };
}

/**
 * Returns every Facebook Page the user administers, along with the linked
 * Instagram Business account where one exists.
 */
export async function fetchPages(userToken: string): Promise<RawPage[]> {
  const data = await graphGet<{ data: RawPage[] }>("me/accounts", {
    access_token: userToken,
    fields:
      "id,name,access_token,fan_count,followers_count,picture{url}," +
      "instagram_business_account{id,username,name,followers_count,profile_picture_url}",
    limit: "50",
  });
  return data.data ?? [];
}

export function pagesToAccounts(pages: RawPage[]): ConnectedAccount[] {
  const accounts: ConnectedAccount[] = [];
  const connectedAt = new Date().toISOString();

  for (const page of pages) {
    accounts.push({
      id: page.id,
      platform: "facebook",
      username: page.name,
      displayName: page.name,
      avatarUrl: page.picture?.data?.url,
      followers: page.followers_count ?? page.fan_count ?? 0,
      connectedAt,
    });

    const ig = page.instagram_business_account;
    if (ig) {
      accounts.push({
        id: ig.id,
        platform: "instagram",
        username: ig.username ?? ig.name ?? "instagram",
        displayName: ig.name ?? ig.username ?? "Instagram",
        avatarUrl: ig.profile_picture_url,
        followers: ig.followers_count ?? 0,
        connectedAt,
      });
    }
  }

  return accounts;
}

interface RawInstagramMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  insights?: { data?: Array<{ name: string; values?: Array<{ value: number }> }> };
}

function readInsight(media: RawInstagramMedia, name: string): number {
  const metric = media.insights?.data?.find((entry) => entry.name === name);
  return metric?.values?.[0]?.value ?? 0;
}

export async function fetchInstagramMedia(
  igUserId: string,
  token: string,
  limit = 50,
): Promise<Post[]> {
  const data = await graphGet<{ data: RawInstagramMedia[] }>(`${igUserId}/media`, {
    access_token: token,
    fields:
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp," +
      "like_count,comments_count,insights.metric(reach,shares,saved)",
    limit: String(limit),
  });

  return (data.data ?? []).map((media) => {
    const caption = media.caption ?? "";
    const likes = media.like_count ?? 0;
    const comments = media.comments_count ?? 0;
    const shares = readInsight(media, "shares") || readInsight(media, "saved");
    const reach = readInsight(media, "reach");

    return {
      id: media.id,
      title: caption.split("\n")[0]?.slice(0, 90) || "Instagram post",
      content: caption,
      platform: "instagram" as const,
      likes,
      comments,
      shares,
      reach,
      impressions: reach,
      thumbnail: media.thumbnail_url ?? media.media_url,
      permalink: media.permalink,
      created_at: media.timestamp ?? new Date().toISOString(),
    };
  });
}

interface RawPagePost {
  id: string;
  message?: string;
  created_time?: string;
  full_picture?: string;
  permalink_url?: string;
  shares?: { count?: number };
  likes?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  insights?: { data?: Array<{ name: string; values?: Array<{ value: number }> }> };
}

export async function fetchFacebookPosts(
  pageId: string,
  pageToken: string,
  limit = 50,
): Promise<Post[]> {
  const data = await graphGet<{ data: RawPagePost[] }>(`${pageId}/posts`, {
    access_token: pageToken,
    fields:
      "id,message,created_time,full_picture,permalink_url,shares," +
      "likes.summary(true).limit(0),comments.summary(true).limit(0)," +
      "insights.metric(post_impressions_unique)",
    limit: String(limit),
  });

  return (data.data ?? []).map((post) => {
    const message = post.message ?? "";
    const reach =
      post.insights?.data?.find((d) => d.name === "post_impressions_unique")?.values?.[0]
        ?.value ?? 0;

    return {
      id: post.id,
      title: message.split("\n")[0]?.slice(0, 90) || "Facebook post",
      content: message,
      platform: "facebook" as const,
      likes: post.likes?.summary?.total_count ?? 0,
      comments: post.comments?.summary?.total_count ?? 0,
      shares: post.shares?.count ?? 0,
      reach,
      impressions: reach,
      thumbnail: post.full_picture,
      permalink: post.permalink_url,
      created_at: post.created_time ?? new Date().toISOString(),
    };
  });
}

/** Shape persisted (encrypted) in the sp_meta cookie. */
export interface MetaConnection {
  userToken: string;
  expiresAt: number;
  accounts: ConnectedAccount[];
  pageTokens: Record<string, string>;
  /** Instagram business account id -> owning page id. */
  igToPage: Record<string, string>;
}
