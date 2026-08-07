import { sign, verify } from "./crypto";

export const SESSION_COOKIE = "sp_session";
export const META_COOKIE = "sp_meta";
export const OAUTH_STATE_COOKIE = "sp_oauth_state";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  email: string;
  name: string;
  /** Issued-at, seconds since epoch. */
  iat: number;
  exp: number;
}

/**
 * Falls back to a build-time-stable development secret so `next build` and
 * local `next dev` work before AUTH_SECRET is set. Production deployments
 * should always set a real one — see the warning in `getSessionSecret`.
 */
const DEV_SECRET = "socialpulse-development-secret-do-not-use-in-production";

export function getSessionSecret(): string {
  const secret = (process.env.AUTH_SECRET ?? "").trim();
  if (secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] AUTH_SECRET is missing or too short. Sessions are signed with a " +
        "publicly known development key. Set AUTH_SECRET in your environment.",
    );
  }
  return DEV_SECRET;
}

export async function createSessionToken(email: string, name: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email,
    name,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };
  return sign(payload, getSessionSecret());
}

export async function readSessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const payload = await verify<SessionPayload>(token, getSessionSecret());
  if (!payload) return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
