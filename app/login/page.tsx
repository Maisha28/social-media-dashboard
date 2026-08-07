"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BarChart3, Loader2, Lock, Mail, Sparkles, Zap } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/dashboard";

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState<"form" | "demo" | null>(null);
  const [error, setError] = React.useState("");

  async function submit(payload: { email?: string; password?: string; mode: string }) {
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Sign in failed. Please try again.");
        return;
      }

      // A full navigation so middleware sees the new cookie.
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass edge-lit rounded-3xl p-7 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/50">
            <Sparkles className="size-5 text-white" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">SocialPulse</h1>
            <p className="text-xs text-ink-faint">Analytics workspace</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          {mode === "signin"
            ? "Sign in to see reach, engagement and growth across your channels."
            : "Set up a workspace and connect your first account in under a minute."}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
          >
            {error}
          </div>
        )}

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPending("form");
            submit({ email, password, mode });
          }}
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input pl-10"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input pl-10"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <button type="submit" disabled={pending !== null} className="btn btn-primary w-full">
            {pending === "form" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "signin" ? "Signing in…" : "Creating account…"}
              </>
            ) : (
              <>
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-widest text-ink-faint">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          disabled={pending !== null}
          onClick={() => {
            setPending("demo");
            submit({ mode: "demo" });
          }}
          className="btn btn-ghost w-full"
        >
          {pending === "demo" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Zap className="size-4 text-amber-300" />
          )}
          Explore the live demo
        </button>

        <p className="mt-6 text-center text-sm text-ink-muted">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            className="font-medium text-violet-300 underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        {!isSupabaseConfigured && (
          <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-200/90">
            Supabase is not configured on this deployment, so credentials are not
            verified against a real user directory. Add your Supabase keys to enable
            genuine authentication.
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      {/* Marketing panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/8 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <Sparkles className="size-4.5 text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">SocialPulse</span>
        </div>

        <div className="max-w-lg">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">
            <span className="text-gradient">Every channel.</span>
            <br />
            <span className="text-ink">One honest number.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
            Connect Instagram and Facebook through Meta&apos;s official login, and
            SocialPulse turns raw reach and engagement into the handful of decisions
            actually worth making this week.
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              { icon: BarChart3, text: "Weighted engagement scoring across every connected account" },
              { icon: Sparkles, text: "AI insights that cite your own data, never generic advice" },
              { icon: Zap, text: "Forecasts, comparisons and exportable client-ready reports" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-violet-300">
                  <item.icon className="size-3.5" />
                </span>
                <span className="text-sm text-ink-muted">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-faint">
          Accounts are linked with Meta OAuth. SocialPulse never asks for, sees or
          stores your social passwords.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <React.Suspense fallback={<div className="skeleton h-96 w-full max-w-md rounded-3xl" />}>
          <LoginForm />
        </React.Suspense>
      </section>
    </div>
  );
}
