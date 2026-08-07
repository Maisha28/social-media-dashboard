import { NextResponse } from "next/server";
import { YOUTUBE_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(YOUTUBE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
