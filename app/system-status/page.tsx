"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw } from "lucide-react";
import { Badge, Button, Card, PageHeader, SectionHeading } from "@/components/ui";

interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  state: "operational" | "degraded" | "not-configured";
  detail: string;
  latencyMs?: number;
}

interface StatusResponse {
  overall: ServiceStatus["state"];
  checkedAt: string;
  services: ServiceStatus[];
}

const PRESENTATION = {
  operational: {
    icon: CheckCircle2,
    tone: "success" as const,
    label: "Operational",
    color: "text-emerald-300",
  },
  degraded: {
    icon: AlertTriangle,
    tone: "danger" as const,
    label: "Needs attention",
    color: "text-rose-300",
  },
  "not-configured": {
    icon: CircleDashed,
    tone: "warning" as const,
    label: "Not configured",
    color: "text-amber-300/70",
  },
};

export default function SystemStatusPage() {
  const [status, setStatus] = React.useState<StatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      setStatus(await res.json());
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const overall = status ? PRESENTATION[status.overall] : null;

  return (
    <>
      <PageHeader
        eyebrow="Diagnostics"
        title="System status"
        description="Live checks against every external service this deployment depends on."
        actions={
          <Button onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Re-check
          </Button>
        }
      />

      {loading && !status ? (
        <div className="space-y-4">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      ) : !status ? (
        <Card className="border-rose-400/25 bg-rose-400/5 p-6">
          <p className="text-sm text-rose-200">Could not reach the status endpoint.</p>
        </Card>
      ) : (
        <>
          <Card lit className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              {overall && (
                <span
                  className={`grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 ${overall.color}`}
                >
                  <overall.icon className="size-6" />
                </span>
              )}
              <div>
                <p className="text-lg font-semibold text-ink">
                  {status.overall === "operational"
                    ? "All systems operational"
                    : status.overall === "degraded"
                      ? "Some services need attention"
                      : "Partially configured"}
                </p>
                <p className="text-sm text-ink-muted">
                  Last checked{" "}
                  {new Date(status.checkedAt).toLocaleTimeString(undefined, {
                    timeStyle: "medium",
                  })}
                </p>
              </div>
            </div>
            {overall && <Badge tone={overall.tone}>{overall.label}</Badge>}
          </Card>

          <SectionHeading
            title="Services"
            description="Anything marked 'not configured' simply falls back to sample data — it will not break the app."
          />

          <div className="grid gap-3">
            {status.services.map((service) => {
              const presentation = PRESENTATION[service.state];
              const Icon = presentation.icon;
              return (
                <Card key={service.id} interactive className="flex items-start gap-4 p-5">
                  <span
                    className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 ${presentation.color}`}
                  >
                    <Icon className="size-4.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{service.name}</h3>
                      <Badge tone={presentation.tone}>{presentation.label}</Badge>
                      {service.latencyMs !== undefined && (
                        <span className="tabular text-xs text-ink-faint">
                          {service.latencyMs} ms
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-faint">{service.description}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.detail}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5">
            <p className="text-sm text-ink-muted">
              Environment variables are configured in Vercel under{" "}
              <span className="text-ink">Project Settings → Environment Variables</span>, then
              take effect on the next deployment. Setup instructions for each service are in
              the project README, and account linking lives on the{" "}
              <Link href="/connections" className="text-violet-300 underline-offset-4 hover:underline">
                Connections
              </Link>{" "}
              page.
            </p>
          </Card>
        </>
      )}
    </>
  );
}
