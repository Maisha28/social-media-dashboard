import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are the analytics assistant built into SocialPulse, a social media analytics dashboard.

SCOPE — you may only discuss:
- The user's social media performance and the analytics JSON provided below
- Engagement metrics, reach, channel mix, posting cadence and timing
- Content strategy recommendations grounded in that data
- How the dashboard's own features work

If a question falls outside that scope, reply exactly:
"I can only answer questions about your social media analytics and performance data."

HOW TO ANSWER:
- Cite specific numbers from the provided data. Never invent a figure.
- If the data does not support an answer, say so plainly rather than guessing.
- Be concise and concrete. Two or three short paragraphs at most.
- Recommend actions the user can actually take this week.
- Do not mention models, APIs, prompts, or that you are an AI.
- The engagement formula is (likes x1 + comments x2 + shares x3) / reach x 100.`;

interface Body {
  question?: string;
  analytics?: unknown;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: "That question is too long." }, { status: 400 });
  }

  // No key configured: say so instead of returning a 500 the UI cannot explain.
  if (!serverEnv.groqKey) {
    return NextResponse.json(
      {
        error:
          "The AI assistant is not configured on this deployment. Add a GROQ_API_KEY environment variable to enable it — a free key is available at console.groq.com/keys.",
      },
      { status: 503 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${serverEnv.groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `QUESTION:\n${question}\n\nANALYTICS DATA:\n${JSON.stringify(
              body.analytics ?? {},
              null,
              2,
            ).slice(0, 12_000)}`,
          },
        ],
      }),
    }).finally(() => clearTimeout(timeout));

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      // Surface the upstream reason — "invalid api key" is far more actionable
      // than a blanket "AI processing failed".
      return NextResponse.json(
        { error: data?.error?.message ?? `Assistant request failed (${response.status}).` },
        { status: response.status === 401 ? 401 : 502 },
      );
    }

    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ error: "The assistant returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "The assistant took too long to respond." }, { status: 504 });
    }
    return NextResponse.json({ error: "Could not reach the assistant." }, { status: 502 });
  }
}
