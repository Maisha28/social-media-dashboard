"use client";

import * as React from "react";
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  Search,
  Unlink,
  Youtube,
} from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import VerticalWorkspace from "@/components/VerticalWorkspace";
import { formatCompact } from "@/lib/analytics";
import { useYoutubeVertical } from "@/lib/use-youtube-vertical";

const EXAMPLES = ["@mrbeast", "@nasa", "@ted", "@veritasium"];

export default function YoutubeVerticalPage() {
  const { channel, posts, loading, error, isPersisted, connecting, search, connect, disconnect } =
    useYoutubeVertical();
  const [query, setQuery] = React.useState("");

  return (
    <>
      <PageHeader
        eyebrow="Vertical"
        title="YouTube"
        description="Search any public channel, or view the one you've connected — every feature below runs on whichever account is shown."
      />

      <Card className="p-5 sm:p-6">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            search(query);
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="@handle, channel URL, or channel id…"
              aria-label="YouTube channel to look up"
              className="input pl-10"
            />
          </div>
          <button type="submit" disabled={loading || !query.trim()} className="btn btn-primary shrink-0">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Look up
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-faint">Try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                search(example);
              }}
              className="chip transition-colors hover:border-violet-400/40 hover:text-violet-200"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-300">
            {error}
          </p>
        )}
      </Card>

      {channel && (
        <Card lit className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
          {channel.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.thumbnail}
              alt=""
              className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="size-6 text-white" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-ink">{channel.title}</p>
              {isPersisted ? (
                <Badge tone="success">
                  <CheckCircle2 className="size-3" />
                  Connected
                </Badge>
              ) : (
                <Badge tone="info">Viewing (not saved)</Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-faint">
              {formatCompact(channel.subscribers)} subscribers · {formatCompact(channel.videoCount)}{" "}
              videos
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`https://youtube.com/channel/${channel.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !py-2 text-xs"
            >
              <ExternalLink className="size-3.5" />
              Open
            </a>
            {isPersisted ? (
              <button onClick={disconnect} disabled={connecting} className="btn btn-ghost !py-2 text-xs">
                {connecting ? <Loader2 className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />}
                Disconnect
              </button>
            ) : (
              <button onClick={connect} disabled={connecting} className="btn btn-primary !py-2 text-xs">
                {connecting ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
                Make this my connected channel
              </button>
            )}
          </div>
        </Card>
      )}

      {loading && !channel ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <VerticalWorkspace
          platformLabel="YouTube"
          accountLabel={channel?.title ?? "this channel"}
          posts={posts}
          accent="var(--chart-6)"
        />
      )}
    </>
  );
}
