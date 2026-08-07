"use client";

import * as React from "react";
import {
  Facebook,
  Info,
  Instagram,
  Link2,
  RefreshCw,
  Unlink,
  Users,
} from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import VerticalWorkspace from "@/components/VerticalWorkspace";
import { formatCompact } from "@/lib/analytics";
import { useMetaVertical } from "@/lib/use-meta-vertical";

interface MetaVerticalPageProps {
  platform: "instagram" | "facebook";
}

const PRESENTATION = {
  instagram: {
    label: "Instagram",
    icon: Instagram,
    gradient: "from-fuchsia-500 via-rose-500 to-amber-400",
    accent: "var(--chart-5)",
    requirement:
      "Requires a Business or Creator Instagram account linked to a Facebook Page you administer.",
  },
  facebook: {
    label: "Facebook",
    icon: Facebook,
    gradient: "from-blue-500 to-indigo-600",
    accent: "var(--chart-1)",
    requirement: "Shows every Facebook Page you administer once connected.",
  },
} as const;

/**
 * Shared by /instagram and /facebook — same shape as the YouTube vertical,
 * but with no ad-hoc "search any account" mode. Meta has no public endpoint
 * for someone else's Page or Instagram Business insights; the only path in is
 * OAuth for accounts you administer, handled on /connections.
 */
export default function MetaVerticalPage({ platform }: MetaVerticalPageProps) {
  const { configured, connected, accounts, posts, loading, notice, refresh } =
    useMetaVertical(platform);
  const presentation = PRESENTATION[platform];
  const Icon = presentation.icon;

  async function disconnect() {
    await fetch("/api/meta/disconnect", { method: "POST" }).catch(() => {});
    refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Vertical"
        title={presentation.label}
        description={`${presentation.requirement} Every feature below runs on whichever account is connected.`}
        actions={
          <Button onClick={refresh} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      {!configured ? (
        <Card className="border-amber-400/20 bg-amber-400/5 p-5 sm:p-6">
          <p className="text-sm font-medium text-amber-200">Meta app not configured yet</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            Add <code className="font-mono text-xs text-ink">META_APP_ID</code>,{" "}
            <code className="font-mono text-xs text-ink">META_APP_SECRET</code> and{" "}
            <code className="font-mono text-xs text-ink">AUTH_SECRET</code> to your environment
            variables, then redeploy. Full walkthrough is in the README.
          </p>
        </Card>
      ) : !connected ? (
        <Card lit className="flex flex-col items-start gap-4 p-6 sm:p-8">
          <span
            className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${presentation.gradient}`}
          >
            <Icon className="size-6 text-white" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-ink">No {presentation.label} account connected</h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
              {presentation.label} data comes only from accounts you actually administer, approved
              through Meta&apos;s own sign-in — there is no way to look up someone else&apos;s account,
              by design.
            </p>
          </div>
          <a href="/api/auth/meta/start" className="btn btn-primary">
            <Link2 className="size-4" />
            Continue with Facebook
          </a>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} interactive lit className="p-5">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${presentation.gradient}`}
                  >
                    <Icon className="size-5 text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{account.displayName}</p>
                    <p className="truncate text-xs text-ink-faint">
                      {platform === "instagram" ? "@" : ""}
                      {account.username}
                    </p>
                  </div>
                  <Badge tone="success">Live</Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-white/8 pt-4 text-sm">
                  <Users className="size-4 text-ink-faint" />
                  <span className="tabular font-semibold text-ink">
                    {formatCompact(account.followers)}
                  </span>
                  <span className="text-ink-faint">followers</span>
                </div>
              </Card>
            ))}
          </div>

          {accounts.length > 1 && (
            <Card className="flex items-start gap-3 border-cyan-400/20 bg-cyan-400/5 p-4">
              <Info className="mt-0.5 size-4.5 shrink-0 text-cyan-300" />
              <p className="text-sm text-ink-muted">
                You have {accounts.length} {presentation.label} accounts connected. The insights,
                forecast and report below combine posts from all of them.
              </p>
            </Card>
          )}

          {notice && (
            <Card className="border-amber-400/20 bg-amber-400/5 p-4 text-sm text-ink-muted">
              {notice}
            </Card>
          )}

          <button onClick={disconnect} className="btn btn-ghost text-xs">
            <Unlink className="size-3.5" />
            Disconnect Meta account
          </button>
        </div>
      )}

      {connected && !loading && (
        <VerticalWorkspace
          platformLabel={presentation.label}
          accountLabel={
            accounts.length === 1 ? accounts[0].displayName : `your ${presentation.label} accounts`
          }
          posts={posts}
          accent={presentation.accent}
        />
      )}
    </>
  );
}
