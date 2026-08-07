import { cookies } from "next/headers";
import { decryptString } from "./crypto";
import { META_COOKIE, getSessionSecret } from "./session";
import type { MetaConnection } from "./meta";

/** Reads and decrypts the stored Meta connection, or null if absent/expired. */
export async function getMetaConnection(): Promise<MetaConnection | null> {
  const store = await cookies();
  const raw = store.get(META_COOKIE)?.value;
  if (!raw) return null;

  const decrypted = await decryptString(raw, getSessionSecret());
  if (!decrypted) return null;

  try {
    const connection = JSON.parse(decrypted) as MetaConnection;
    if (!connection.userToken) return null;
    if (connection.expiresAt && connection.expiresAt < Date.now()) return null;
    return connection;
  } catch {
    return null;
  }
}
