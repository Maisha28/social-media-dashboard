import { NextResponse } from "next/server";
import { getMetaConnection } from "@/lib/meta-server";
import { fetchFacebookPosts, fetchInstagramMedia } from "@/lib/meta";
import type { Post } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pulls recent posts from every connected Instagram and Facebook account. */
export async function GET() {
  const connection = await getMetaConnection();
  if (!connection) {
    return NextResponse.json({ connected: false, posts: [] }, { status: 200 });
  }

  const posts: Post[] = [];
  const errors: string[] = [];

  await Promise.all(
    connection.accounts.map(async (account) => {
      try {
        if (account.platform === "instagram") {
          // Instagram media is read with the token of the Page that owns it.
          const pageId = connection.igToPage[account.id];
          const token = (pageId && connection.pageTokens[pageId]) || connection.userToken;
          posts.push(...(await fetchInstagramMedia(account.id, token)));
        } else if (account.platform === "facebook") {
          const token = connection.pageTokens[account.id] ?? connection.userToken;
          posts.push(...(await fetchFacebookPosts(account.id, token)));
        }
      } catch (error) {
        errors.push(
          `${account.displayName}: ${error instanceof Error ? error.message : "fetch failed"}`,
        );
      }
    }),
  );

  posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    connected: true,
    count: posts.length,
    posts,
    errors: errors.length > 0 ? errors : undefined,
  });
}
