"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Facebook,
  Info,
  Instagram,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Unlink,
  Users,
} from "lucide-react";
import { Badge, Button, Card, PageHeader, SectionHeading } from "@/components/ui";
import { formatCompact } from "@/lib/analytics";
import type { ConnectedAccount } from "@/lib/types";

interface AccountsResponse {
  connected: boolean;
  configured: boolean;
  accounts: ConnectedAccount[];
  expiresAt?: number;
}

function ConnectionsInner() {
  const params = useSearchParams();
  const [state, setState] = React.useState<AccountsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [disconnecting, setDisconnecting] = React.useState(false);

  const oauthError = params.get("error");
  const justConnected = params.get("connected") === "1";

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta/accounts", { cache: "no-store" });
      setState(await res.json());
    } catch {
      setState({ connected: false, configured: false, accounts: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function disconnect() {
    setDisconnecting(true);
    await fetch("/api/meta/disconnect", { method: "POST" }).catch(() => {});
    setDisconnecting(false);
    load();
  }

  const accounts = state?.accounts ?? [];
  const instagram = accounts.filter((a) => a.platform === "instagram");
  const facebook = accounts.filter((a) => a.platform === "facebook");

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Connected accounts"
        description="Link Instagram and Facebook through Meta's official login to replace the sample data with your own reach, engagement and follower numbers."
        actions={
          <Button onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      {oauthError && (
        <Card className="flex items-start gap-3 border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-rose-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-rose-200">Connection failed</p>
            <p className="mt-0.5 break-words text-sm text-ink-muted">{oauthError}</p>
          </div>
        </Card>
      )}

      {justConnected && !oauthError && (
        <Card className="flex items-start gap-3 border-emerald-400/25 bg-emerald-400/5 p-4">
          <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-300" />
          <div>
            <p className="text-sm font-medium text-emerald-200">Accounts connected</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Your dashboard is now reading live data from Meta.
            </p>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Why there is no username + password field                         */}
      {/* ---------------------------------------------------------------- */}
      <Card lit className="p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-emerald-300">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink">
              We never ask for your Instagram or Facebook password
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Meta provides no API that accepts a username and password, and handing
              social credentials to a third-party tool violates their Platform Terms —
              it also breaks the moment two-factor authentication or a login checkpoint
              is triggered, and it routinely gets accounts flagged or disabled.
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
              Instead you authenticate on Meta&apos;s own domain and grant SocialPulse a
              scoped, revocable token. You can withdraw access at any time from{" "}
              <a
                href="https://www.facebook.com/settings?tab=business_tools"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-300 underline-offset-4 hover:underline"
              >
                Facebook → Business integrations
              </a>
              , without changing your password.
            </p>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Connect / status                                                  */}
      {/* ---------------------------------------------------------------- */}
      {loading ? (
        <Card className="p-6">
          <div className="skeleton h-24 w-full rounded-xl" />
        </Card>
      ) : state?.connected ? (
        <div className="space-y-4">
          <SectionHeading
            title={`${accounts.length} account${accounts.length === 1 ? "" : "s"} linked`}
            description={
              state.expiresAt
                ? `Access renews automatically until ${new Date(state.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}.`
                : undefined
            }
            action={
              <Button onClick={disconnect} disabled={disconnecting}>
                {disconnecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Unlink className="size-4" />
                )}
                Disconnect all
              </Button>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard key={`${account.platform}-${account.id}`} account={account} />
            ))}
          </div>

          {instagram.length === 0 && facebook.length > 0 && (
            <Card className="flex items-start gap-3 border-amber-400/20 bg-amber-400/5 p-4">
              <Info className="mt-0.5 size-4.5 shrink-0 text-amber-300" />
              <p className="text-sm text-ink-muted">
                No Instagram account was found. Instagram analytics require a{" "}
                <strong className="text-ink">Business</strong> or{" "}
                <strong className="text-ink">Creator</strong> account that is linked to
                one of your Facebook Pages.
              </p>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card lit className="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400">
                  <Instagram className="size-5 text-white" />
                </span>
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Facebook className="size-5 text-white" />
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">
                Connect Instagram &amp; Facebook
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                One approval links every Facebook Page you manage and any Instagram
                Business account attached to them. Takes about thirty seconds.
              </p>
            </div>

            {state?.configured ? (
              <a href="/api/auth/meta/start" className="btn btn-primary w-full sm:w-auto">
                <Link2 className="size-4" />
                Continue with Facebook
              </a>
            ) : (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3.5">
                <p className="text-sm font-medium text-amber-200">
                  Meta app not configured yet
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Add <code className="font-mono text-xs text-ink">META_APP_ID</code>,{" "}
                  <code className="font-mono text-xs text-ink">META_APP_SECRET</code> and{" "}
                  <code className="font-mono text-xs text-ink">AUTH_SECRET</code> to your
                  environment variables, then redeploy. Full walkthrough is in the README.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6 sm:p-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Before you connect
            </h3>
            <ol className="mt-4 space-y-4">
              {[
                {
                  title: "Use a Business or Creator account",
                  body: "Personal Instagram accounts cannot expose insights through any API. Switch in the Instagram app under Settings → Account type.",
                },
                {
                  title: "Link it to a Facebook Page",
                  body: "Instagram data is read through the Page that owns the account. Any Page you administer will do.",
                },
                {
                  title: "Approve the requested permissions",
                  body: "Read-only access to page list, engagement and insights. SocialPulse cannot post, delete or message on your behalf.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-violet-400/15 text-xs font-semibold text-violet-200">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </>
  );
}

function AccountCard({ account }: { account: ConnectedAccount }) {
  const isInstagram = account.platform === "instagram";
  const Icon = isInstagram ? Instagram : Facebook;

  return (
    <Card interactive lit className="p-5">
      <div className="flex items-center gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${
            isInstagram
              ? "from-fuchsia-500 via-rose-500 to-amber-400"
              : "from-blue-500 to-indigo-600"
          }`}
        >
          <Icon className="size-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{account.displayName}</p>
          <p className="truncate text-xs text-ink-faint">
            {isInstagram ? "@" : ""}
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
  );
}

export default function ConnectionsPage() {
  return (
    <React.Suspense fallback={<div className="skeleton h-64 w-full rounded-2xl" />}>
      <ConnectionsInner />
    </React.Suspense>
  );
}
