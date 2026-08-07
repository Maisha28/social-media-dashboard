/**
 * Central place for environment access.
 *
 * Nothing here throws at import time. A missing key degrades one feature into
 * demo mode rather than taking the whole deployment down — which is what you
 * want on Vercel, where a build must succeed before you can add env vars.
 */

function readPublic(name: string, value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  // Next inlines NEXT_PUBLIC_* at build time; guard against the literal
  // placeholder strings people leave behind in .env files.
  if (!trimmed || trimmed.startsWith("your-") || trimmed === "undefined") return "";
  return trimmed;
}

export const SUPABASE_URL = readPublic(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = readPublic(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** True when both Supabase values look usable. */
export const hasSupabase = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(SUPABASE_URL),
);

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

// --- server-only below -------------------------------------------------------

export const serverEnv = {
  get metaAppId() {
    return (process.env.META_APP_ID ?? "").trim();
  },
  get metaAppSecret() {
    return (process.env.META_APP_SECRET ?? "").trim();
  },
  get authSecret() {
    return (process.env.AUTH_SECRET ?? "").trim();
  },
  get groqKey() {
    return (process.env.GROQ_API_KEY ?? "").trim();
  },
  get youtubeKey() {
    return (process.env.YOUTUBE_API_KEY ?? "").trim();
  },
  get supabaseServiceKey() {
    return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  },
};

export function hasMetaOAuth(): boolean {
  return Boolean(serverEnv.metaAppId && serverEnv.metaAppSecret && serverEnv.authSecret);
}
