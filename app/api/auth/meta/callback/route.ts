import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL, hasMetaOAuth } from "@/lib/env";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchPages,
  pagesToAccounts,
  type MetaConnection,
} from "@/lib/meta";
import { encryptString } from "@/lib/crypto";
import { META_COOKIE, OAUTH_STATE_COOKIE, getSessionSecret } from "@/lib/session";

export const runtime = "nodejs";

function fail(message: string) {
  return NextResponse.redirect(`${SITE_URL}/connections?error=${encodeURIComponent(message)}`);
}

export async function GET(request: NextRequest) {
  if (!hasMetaOAuth()) return fail("Meta OAuth is not configured on this deployment.");

  const params = request.nextUrl.searchParams;

  // The user pressed Cancel on Meta's consent screen.
  if (params.get("error")) {
    return fail(params.get("error_description") ?? "Authorisation was cancelled.");
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code) return fail("Meta did not return an authorisation code.");
  if (!state || !expectedState || state !== expectedState) {
    return fail("Security check failed. Please start the connection again.");
  }

  try {
    const shortToken = await exchangeCodeForToken(code);
    const { token, expiresIn } = await exchangeForLongLivedToken(shortToken);
    const pages = await fetchPages(token);

    if (pages.length === 0) {
      return fail(
        "No Facebook Pages found on that account. Instagram analytics require a " +
          "Business or Creator account linked to a Facebook Page.",
      );
    }

    const pageTokens: Record<string, string> = {};
    const igToPage: Record<string, string> = {};
    for (const page of pages) {
      pageTokens[page.id] = page.access_token;
      if (page.instagram_business_account) {
        igToPage[page.instagram_business_account.id] = page.id;
      }
    }

    const connection: MetaConnection = {
      userToken: token,
      expiresAt: Date.now() + expiresIn * 1000,
      accounts: pagesToAccounts(pages),
      pageTokens,
      igToPage,
    };

    // Access tokens are encrypted at rest, not just base64'd — the cookie is
    // still sent to the browser and must not be readable if it leaks.
    const encrypted = await encryptString(JSON.stringify(connection), getSessionSecret());

    const response = NextResponse.redirect(`${SITE_URL}/connections?connected=1`);
    response.cookies.set(META_COOKIE, encrypted, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 55,
    });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not complete the connection.");
  }
}
