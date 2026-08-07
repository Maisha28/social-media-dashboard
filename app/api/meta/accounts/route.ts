import { NextResponse } from "next/server";
import { hasMetaOAuth } from "@/lib/env";
import { getMetaConnection } from "@/lib/meta-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const connection = await getMetaConnection();

  if (!connection) {
    return NextResponse.json({
      connected: false,
      configured: hasMetaOAuth(),
      accounts: [],
    });
  }

  return NextResponse.json({
    connected: true,
    configured: true,
    expiresAt: connection.expiresAt,
    accounts: connection.accounts,
  });
}
