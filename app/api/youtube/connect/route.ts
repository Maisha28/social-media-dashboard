import { NextResponse } from "next/server";
import { YOUTUBE_COOKIE } from "@/lib/session";
import { resolveChannel, type YoutubeConnection } from "@/lib/youtube";

export const runtime = "nodejs";

interface Body {
  handle?: string;
}

/**
 * "Connects" a YouTube channel — really just resolves the given @handle,
 * username, URL, or channel id to a real channel and remembers it. There is
 * no OAuth step because channel statistics are public data; see lib/youtube.ts.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const handle = (body.handle ?? "").trim();
  if (!handle) {
    return NextResponse.json(
      { error: "Enter a channel handle, username, or URL." },
      { status: 400 },
    );
  }

  try {
    const channel = await resolveChannel(handle);
    const connection: YoutubeConnection = { channel, connectedAt: new Date().toISOString() };

    const response = NextResponse.json({ ok: true, channel });
    // Public data only — no access token, so a plain (not encrypted) cookie is fine.
    response.cookies.set(YOUTUBE_COOKIE, JSON.stringify(connection), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not resolve that channel." },
      { status: 502 },
    );
  }
}
