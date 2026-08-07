import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  const session = await readSessionToken(store.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { email: session.email, name: session.name },
  });
}
