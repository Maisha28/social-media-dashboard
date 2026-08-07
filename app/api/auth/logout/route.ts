import { NextResponse } from "next/server";
import { META_COOKIE, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // Clear the session and any stored Meta tokens together.
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(META_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
