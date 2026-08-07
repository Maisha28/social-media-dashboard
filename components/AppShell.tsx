"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  Activity,
  BarChart3,
  Bot,
  FileText,
  LayoutDashboard,
  Layers,
  LineChart,
  Link2,
  LogOut,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveDot } from "@/components/ui";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Content", href: "/content", icon: Layers },
      { name: "Compare", href: "/compare", icon: BarChart3 },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { name: "AI Insights", href: "/ai-insights", icon: Sparkles, badge: "AI" },
      { name: "Ask AI", href: "/ask-ai", icon: Bot },
      { name: "Predictions", href: "/predictions", icon: LineChart },
    ],
  },
  {
    section: "Workspace",
    items: [
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Connections", href: "/connections", icon: Link2 },
      { name: "System status", href: "/system-status", icon: Activity },
    ],
  },
];

/** Routes that render without the dashboard chrome. */
const BARE_ROUTES = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [user, setUser] = React.useState<{ email: string; name: string } | null>(null);

  const isBare = BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  // Close the drawer whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (isBare) return;
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.user) setUser(json.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isBare]);

  const handleLogout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }, [router]);

  if (isBare) return <>{children}</>;

  return (
    <div className="flex min-h-dvh">
      {/* Backdrop for the mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/8 bg-[oklch(0.17_0.024_268)]/85 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/50">
              <Sparkles className="size-4.5 text-white" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold leading-tight tracking-tight text-ink">
                SocialPulse
              </span>
              <span className="block text-[11px] leading-tight text-ink-faint">
                Analytics workspace
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-white/8 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                {group.section}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-white/8 text-ink"
                            : "text-ink-muted hover:bg-white/5 hover:text-ink",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-cyan-400" />
                        )}
                        <Icon
                          className={cn(
                            "size-4.5 shrink-0 transition-colors",
                            active ? "text-violet-300" : "text-ink-faint group-hover:text-ink-muted",
                          )}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && (
                          <span className="rounded-md bg-violet-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 text-sm font-semibold text-ink ring-1 ring-white/10">
              {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium capitalize text-ink">
                {user?.name ?? "Signed in"}
              </p>
              <p className="truncate text-xs text-ink-faint">{user?.email ?? " "}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-white/8 hover:text-rose-300"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-[oklch(0.16_0.022_268)]/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-muted hover:bg-white/8 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="chip">
              <LiveDot />
              Live
            </span>
            <Link href="/connections" className="btn btn-primary !px-3 !py-2 text-xs">
              <Link2 className="size-3.5" />
              Connect account
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
        </main>

        <footer className="px-4 py-6 text-center text-xs text-ink-faint lg:px-8">
          SocialPulse — analytics for Instagram, Facebook and beyond.
        </footer>
      </div>
    </div>
  );
}
