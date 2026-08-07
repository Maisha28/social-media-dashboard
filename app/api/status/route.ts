import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasMetaOAuth, hasSupabase, serverEnv } from "@/lib/env";
import { getMetaConnection } from "@/lib/meta-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  state: "operational" | "degraded" | "not-configured";
  detail: string;
  latencyMs?: number;
}

/** Probes Supabase's REST root, which responds without needing a table to exist. */
async function probeSupabase(): Promise<ServiceStatus> {
  const base = {
    id: "supabase",
    name: "Supabase",
    description: "Database and authentication",
  };

  if (!hasSupabase) {
    return {
      ...base,
      state: "not-configured",
      detail:
        "No project URL or anon key set. The app is serving generated sample data.",
    };
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      signal: controller.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    const latencyMs = Date.now() - started;

    if (res.ok) {
      return { ...base, state: "operational", detail: "Responding normally.", latencyMs };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ...base,
        state: "degraded",
        detail: `Project reachable but the anon key was rejected (HTTP ${res.status}). Check NEXT_PUBLIC_SUPABASE_ANON_KEY.`,
        latencyMs,
      };
    }
    return { ...base, state: "degraded", detail: `Unexpected HTTP ${res.status}.`, latencyMs };
  } catch (error) {
    const isDns =
      error instanceof Error && /ENOTFOUND|getaddrinfo|fetch failed/i.test(error.message);
    return {
      ...base,
      state: "degraded",
      detail: isDns
        ? "Host could not be resolved. The project has most likely been paused or deleted — create a new one and update NEXT_PUBLIC_SUPABASE_URL."
        : error instanceof Error
          ? error.message
          : "Unreachable.",
    };
  }
}

export async function GET() {
  const connection = await getMetaConnection();

  const services: ServiceStatus[] = [
    await probeSupabase(),
    {
      id: "meta",
      name: "Meta (Instagram + Facebook)",
      description: "Account connection via Facebook Login",
      state: !hasMetaOAuth() ? "not-configured" : connection ? "operational" : "degraded",
      detail: !hasMetaOAuth()
        ? "META_APP_ID, META_APP_SECRET or AUTH_SECRET is missing."
        : connection
          ? `${connection.accounts.length} account${connection.accounts.length === 1 ? "" : "s"} linked. Token valid until ${new Date(connection.expiresAt).toLocaleDateString()}.`
          : "Configured, but no account has been connected yet.",
    },
    {
      id: "groq",
      name: "AI assistant",
      description: "Powers the Ask AI page",
      state: serverEnv.groqKey ? "operational" : "not-configured",
      detail: serverEnv.groqKey
        ? "API key present."
        : "GROQ_API_KEY is not set. The Ask AI page will explain this to users.",
    },
    {
      id: "youtube",
      name: "YouTube Data API",
      description: "Optional channel statistics",
      state: serverEnv.youtubeKey ? "operational" : "not-configured",
      detail: serverEnv.youtubeKey ? "API key present." : "YOUTUBE_API_KEY is not set.",
    },
    {
      id: "auth",
      name: "Session signing",
      description: "Protects dashboard routes",
      state: serverEnv.authSecret.length >= 16 ? "operational" : "degraded",
      detail:
        serverEnv.authSecret.length >= 16
          ? "AUTH_SECRET is set. Sessions are signed and Meta tokens encrypted."
          : "AUTH_SECRET is missing, so a publicly known development key is in use. Set it before sharing this deployment.",
    },
  ];

  /* A service that is merely unconfigured is not a fault — it falls back to
     sample data. But we must not claim "all operational" while some are off. */
  const worst = services.some((s) => s.state === "degraded")
    ? "degraded"
    : services.some((s) => s.state === "not-configured")
      ? "not-configured"
      : "operational";

  return NextResponse.json({
    overall: worst,
    checkedAt: new Date().toISOString(),
    services,
  });
}
