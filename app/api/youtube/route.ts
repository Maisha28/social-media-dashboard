import { NextResponse, type NextRequest } from "next/server";
import { fetchChannelVideos, resolveChannel } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-off public lookup for any YouTube channel — independent of the
 * connect/disconnect flow in /api/youtube/connect, which remembers a channel
 * for the dashboard. This is for ad-hoc queries (e.g. a future "look up any
 * channel" tool) and accepts a handle, URL, username, or channel id.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("channel") ??
    request.nextUrl.searchParams.get("channelId");

  if (!query) {
    return NextResponse.json(
      { success: false, error: "A channel query parameter is required (handle, URL, or channel id)." },
      { status: 400 },
    );
  }

  try {
    const channel = await resolveChannel(query);
    const posts = await fetchChannelVideos(channel, 25);
    return NextResponse.json({ success: true, channel, posts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "YouTube request failed." },
      { status: 502 },
    );
  }
}
