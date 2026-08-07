import { NextResponse } from "next/server";
import { META_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(META_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
