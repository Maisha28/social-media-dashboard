"use client";

import * as React from "react";
import { Bot, CornerDownLeft, Loader2, Sparkles, User } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { useAnalytics } from "@/lib/use-analytics";
import { byPlatform, formatCompact, weightedEngagement } from "@/lib/analytics";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Which channel should I post more on this week?",
  "Why did my engagement drop recently?",
  "What do my top five posts have in common?",
  "How does my engagement rate compare to a healthy benchmark?",
];

let messageCounter = 0;
function nextId() {
  messageCounter += 1;
  return `m${messageCounter}`;
}

export default function AskAiPage() {
  const { posts, summary, source } = useAnalytics();

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I have your last 30 days of posts loaded. Ask me about engagement, channel mix, timing, or which post to make next — I'll answer from your numbers, not generic advice.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  /** Compact digest sent to the model — never the full post list. */
  const digest = React.useMemo(() => {
    const channels = byPlatform(posts).map((entry) => ({
      channel: entry.platform,
      posts: entry.posts,
      engagement: entry.engagement,
      reach: entry.reach,
    }));

    const top = [...posts]
      .sort((a, b) => weightedEngagement(b) - weightedEngagement(a))
      .slice(0, 5)
      .map((post) => ({
        title: post.title,
        channel: post.platform,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        reach: post.reach,
        date: post.created_at.slice(0, 10),
      }));

    return { summary, channels, topPosts: top, dataSource: source };
  }, [posts, summary, source]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    setError("");
    setInput("");
    setMessages((current) => [...current, { id: nextId(), role: "user", text: trimmed }]);
    setSending(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, analytics: digest }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "The assistant is unavailable right now.");
        return;
      }

      setMessages((current) => [
        ...current,
        { id: nextId(), role: "assistant", text: json.answer },
      ]);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Assistant"
        title="Ask AI"
        description="An analyst that can only see your analytics — so it answers with your numbers rather than platitudes."
        actions={
          <Badge tone={source === "demo" ? "warning" : "success"}>
            {source === "demo" ? "Reading sample data" : "Reading live data"}
          </Badge>
        }
      />

      <Card lit className="flex h-[calc(100dvh-17rem)] min-h-[460px] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-xl border border-white/10 ${
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-violet-200"
                    : "bg-white/5 text-ink-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <Sparkles className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </span>

              <div
                className={`max-w-[min(46rem,85%)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "border border-white/8 bg-white/[0.04] text-ink"
                    : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-violet-200">
                <Sparkles className="size-4" />
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-ink-muted">
                <Loader2 className="size-3.5 animate-spin" />
                Reading your analytics…
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            >
              {error}
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-white/8 px-5 py-4 sm:px-6">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="chip transition-colors hover:border-violet-400/40 hover:text-violet-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex items-end gap-2 border-t border-white/8 p-4 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends; Shift+Enter inserts a newline.
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask about your engagement, channels or what to post next…"
              aria-label="Your question"
              className="input max-h-40 resize-none py-3 pr-11"
            />
            <CornerDownLeft className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-ink-faint" />
          </div>
          <button
            type="submit"
            disabled={sending || input.trim().length === 0}
            className="btn btn-primary h-[46px]"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
            Send
          </button>
        </form>
      </Card>

      <p className="text-center text-xs text-ink-faint">
        The assistant sees a summary of {posts.length} posts —{" "}
        {formatCompact(summary.reach)} reach, {formatCompact(summary.weighted)} weighted
        engagement. It never receives your credentials or access tokens.
      </p>
    </>
  );
}
