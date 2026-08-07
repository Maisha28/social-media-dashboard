import { NextResponse } from "next/server";
import { SITE_URL, hasMetaOAuth } from "@/lib/env";
import { buildAuthorizeUrl } from "@/lib/meta";
import { randomToken } from "@/lib/crypto";
import { OAUTH_STATE_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

/** Kicks off Facebook Login. The user approves on Meta's own domain. */
export async function GET() {
  if (!hasMetaOAuth()) {
    return NextResponse.redirect(
      `${SITE_URL}/connections?error=${encodeURIComponent(
        "Meta is not configured yet. Add META_APP_ID, META_APP_SECRET and AUTH_SECRET.",
      )}`,
    );
  }

  // CSRF protection: the state we send must come back unchanged.
  const state = randomToken();
  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
