import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <div className="glass edge-lit max-w-md rounded-2xl p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-300">
          <Compass className="size-6" />
        </span>
        <p className="mt-5 text-4xl font-semibold tracking-tight text-gradient">404</p>
        <h1 className="mt-2 text-lg font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          That route does not exist. It may have been part of an older build.
        </p>
        <Link href="/dashboard" className="btn btn-primary mt-6">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
