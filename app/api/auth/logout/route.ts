import { NextResponse } from "next/server";
import { META_COOKIE, SESSION_COOKIE, YOUTUBE_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // Clear the session and any connected-account state together.
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(META_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(YOUTUBE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
