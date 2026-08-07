"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <div className="glass edge-lit max-w-md rounded-2xl p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-rose-400/25 bg-rose-400/10 text-rose-300">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-5 text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This page hit an unexpected error. Retrying usually resolves it — if it does
          not, check the System status page for a failing service.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-ink-faint">Ref: {error.digest}</p>
        )}
        <button type="button" onClick={reset} className="btn btn-primary mt-6">
          <RotateCcw className="size-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
