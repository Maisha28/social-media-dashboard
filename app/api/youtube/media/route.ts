import { NextResponse } from "next/server";
import { getYoutubeConnection } from "@/lib/youtube-server";
import { fetchChannelVideos } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const connection = await getYoutubeConnection();
  if (!connection) {
    return NextResponse.json({ connected: false, posts: [] });
  }

  try {
    const posts = await fetchChannelVideos(connection.channel, 25);
    return NextResponse.json({ connected: true, count: posts.length, posts });
  } catch (error) {
    return NextResponse.json(
      {
        connected: true,
        posts: [],
        errors: [error instanceof Error ? error.message : "Could not load videos."],
      },
      { status: 200 },
    );
  }
}
