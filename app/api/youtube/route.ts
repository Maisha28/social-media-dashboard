import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import type { Post } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Optional YouTube channel statistics.
 *
 * Replaces three earlier routes that hardcoded NASA's channel id and imported
 * `axios`, which was never listed in package.json — that import alone would
 * have failed the build on a clean Vercel install.
 */
export async function GET(request: NextRequest) {
  const apiKey = serverEnv.youtubeKey;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "YOUTUBE_API_KEY is not configured on this deployment." },
      { status: 503 },
    );
  }

  const channelId = request.nextUrl.searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json(
      { success: false, error: "A channelId query parameter is required." },
      { status: 400 },
    );
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 10) || 10, 50);

  try {
    // 1. Channel snapshot plus the uploads playlist id.
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(channelId)}&key=${apiKey}`,
      { cache: "no-store" },
    );
    const channelData = await channelRes.json();

    if (channelData.error) {
      return NextResponse.json(
        { success: false, error: channelData.error.message },
        { status: 502 },
      );
    }

    const channel = channelData.items?.[0];
    if (!channel) {
      return NextResponse.json(
        { success: false, error: "No channel found for that id." },
        { status: 404 },
      );
    }

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    let posts: Post[] = [];

    // 2. Recent uploads and their per-video statistics.
    if (uploadsPlaylistId) {
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${limit}&key=${apiKey}`,
        { cache: "no-store" },
      );
      const playlistData = await playlistRes.json();

      const videoIds: string[] = (playlistData.items ?? [])
        .map((item: { contentDetails?: { videoId?: string } }) => item.contentDetails?.videoId)
        .filter(Boolean);

      if (videoIds.length > 0) {
        const videosRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${apiKey}`,
          { cache: "no-store" },
        );
        const videosData = await videosRes.json();

        posts = (videosData.items ?? []).map(
          (video: {
            id: string;
            snippet: {
              title: string;
              description: string;
              publishedAt: string;
              thumbnails?: { medium?: { url?: string } };
            };
            statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
          }): Post => {
            const views = Number(video.statistics.viewCount ?? 0);
            return {
              id: video.id,
              title: video.snippet.title,
              content: video.snippet.description?.slice(0, 280) ?? "",
              platform: "youtube",
              likes: Number(video.statistics.likeCount ?? 0),
              comments: Number(video.statistics.commentCount ?? 0),
              // YouTube exposes no share count on the Data API.
              shares: 0,
              reach: views,
              impressions: views,
              thumbnail: video.snippet.thumbnails?.medium?.url,
              permalink: `https://www.youtube.com/watch?v=${video.id}`,
              created_at: video.snippet.publishedAt,
            };
          },
        );
      }
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails?.medium?.url,
        subscribers: Number(channel.statistics.subscriberCount ?? 0),
        views: Number(channel.statistics.viewCount ?? 0),
        videos: Number(channel.statistics.videoCount ?? 0),
      },
      posts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "YouTube request failed.",
      },
      { status: 502 },
    );
  }
}
