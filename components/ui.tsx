"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  interactive = false,
  lit = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean; lit?: boolean }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl",
        interactive && "glass-hover",
        lit && "edge-lit",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

const TONES = {
  neutral: "border-white/10 bg-white/5 text-ink-muted",
  brand: "border-violet-400/25 bg-violet-400/10 text-violet-200",
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  danger: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  info: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LiveDot({ tone = "success" }: { tone?: "success" | "warning" | "danger" }) {
  const color =
    tone === "success" ? "bg-emerald-400" : tone === "warning" ? "bg-amber-400" : "bg-rose-400";
  return <span className={cn("live-dot inline-block size-2 rounded-full", color)} />;
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "ghost", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Animated number                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Counts up to `value` on mount and whenever it changes.
 *
 * Renders the final value on the server so the markup React hydrates against
 * matches, then animates from zero once mounted.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  format,
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = React.useState(value);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const from = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // easeOutExpo — fast to begin with, settles gently on the final digit.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, mounted]);

  const rendered = format ? format(display) : Math.round(display).toLocaleString();
  return <span className={cn("tabular", className)}>{rendered}</span>;
}

/* -------------------------------------------------------------------------- */
/* Stat tile                                                                   */
/* -------------------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  delta,
  hint,
  icon,
  accent = "brand",
  format,
}: {
  label: string;
  value: number;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "brand" | "cyan" | "emerald" | "amber" | "rose";
  format?: (n: number) => string;
}) {
  const accents: Record<string, string> = {
    brand: "from-violet-500/25 to-violet-500/0 text-violet-300",
    cyan: "from-cyan-500/25 to-cyan-500/0 text-cyan-300",
    emerald: "from-emerald-500/25 to-emerald-500/0 text-emerald-300",
    amber: "from-amber-500/25 to-amber-500/0 text-amber-300",
    rose: "from-rose-500/25 to-rose-500/0 text-rose-300",
  };

  const trend =
    delta === undefined ? null : delta > 0 ? "success" : delta < 0 ? "danger" : "neutral";

  return (
    <Card interactive lit className="group relative overflow-hidden p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-gradient-to-br blur-2xl transition-opacity duration-500 opacity-60 group-hover:opacity-100",
          accents[accent],
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-ink-faint">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5",
              accents[accent].split(" ").pop(),
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend || hint) && (
        <div className="relative mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
                trend === "success" && "bg-emerald-400/12 text-emerald-300",
                trend === "danger" && "bg-rose-400/12 text-rose-300",
                trend === "neutral" && "bg-white/8 text-ink-muted",
              )}
            >
              {delta! > 0 ? "▲" : delta! < 0 ? "▼" : "—"} {Math.abs(delta!).toFixed(1)}%
            </span>
          )}
          {hint && <span className="truncate text-ink-faint">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Feedback states                                                             */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && (
        <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-ink-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/80">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          <span className="text-gradient">{title}</span>
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Banner shown whenever the page is rendering simulated rather than live data. */
export function DemoNotice({ notice }: { notice?: string }) {
  return (
    <Card className="flex flex-wrap items-center gap-x-3 gap-y-1 border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm">
      <Badge tone="warning">Sample data</Badge>
      <span className="text-ink-muted">
        {notice ??
          "No live account is connected yet, so these figures are simulated. Connect Instagram or Facebook to see your own numbers."}
      </span>
    </Card>
  );
}
