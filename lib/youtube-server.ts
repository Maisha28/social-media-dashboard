import { cookies } from "next/headers";
import { YOUTUBE_COOKIE } from "./session";
import type { YoutubeConnection } from "./youtube";

/** Reads the stored YouTube connection, or null if none is set. */
export async function getYoutubeConnection(): Promise<YoutubeConnection | null> {
  const store = await cookies();
  const raw = store.get(YOUTUBE_COOKIE)?.value;
  if (!raw) return null;

  try {
    const connection = JSON.parse(raw) as YoutubeConnection;
    return connection.channel?.id ? connection : null;
  } catch {
    return null;
  }
}
