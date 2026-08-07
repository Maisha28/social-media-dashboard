import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { getYoutubeConnection } from "@/lib/youtube-server";
import { channelToAccount } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const connection = await getYoutubeConnection();

  if (!connection) {
    return NextResponse.json({
      connected: false,
      configured: Boolean(serverEnv.youtubeKey),
      accounts: [],
    });
  }

  return NextResponse.json({
    connected: true,
    configured: true,
    accounts: [channelToAccount(connection.channel, connection.connectedAt)],
    channel: connection.channel,
  });
}
