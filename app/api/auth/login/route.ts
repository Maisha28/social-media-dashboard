import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "@/lib/env";

export const runtime = "nodejs";

interface LoginBody {
  email?: string;
  password?: string;
  mode?: "signin" | "signup" | "demo";
}

/**
 * Signs a user in and sets an httpOnly session cookie.
 *
 * When Supabase is configured the credentials are verified against Supabase
 * Auth. When it is not, the app accepts a demo sign-in so the deployment is
 * still usable — but it never pretends the password was checked.
 */
export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const mode = body.mode ?? "signin";

  if (mode !== "demo") {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }
  }

  let displayName = email ? email.split("@")[0] : "Demo user";
  let sessionEmail = email || "demo@socialpulse.app";

  if (hasSupabase && mode !== "demo") {
    const endpoint =
      mode === "signup"
        ? `${SUPABASE_URL}/auth/v1/signup`
        : `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.error_description ||
          data?.msg ||
          data?.message ||
          "Those credentials were not accepted.";
        return NextResponse.json({ error: message }, { status: 401 });
      }

      sessionEmail = data?.user?.email ?? email;
      displayName = data?.user?.user_metadata?.name ?? displayName;
    } catch {
      return NextResponse.json(
        { error: "Could not reach the authentication service. Try again shortly." },
        { status: 502 },
      );
    }
  }

  const token = await createSessionToken(sessionEmail, displayName);

  const response = NextResponse.json({
    ok: true,
    user: { email: sessionEmail, name: displayName },
    // Tells the UI whether the password was actually verified.
    verified: hasSupabase && mode !== "demo",
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
