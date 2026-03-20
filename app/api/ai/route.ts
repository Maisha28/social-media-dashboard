import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Server-side env check (safe)
    console.log('GROQ KEY EXISTS:', !!process.env.GROQ_API_KEY)

    const { question, analyticsSummary, analyticsPosts } = await req.json()

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          temperature: 0.5,
          messages: [
            {
              role: 'system',
              content: `
You are an AI analytics assistant built INSIDE a social media analytics platform.

STRICT RULES (MUST FOLLOW):
- You may ONLY answer questions related to:
  • Social media performance analysis
  • Engagement metrics (likes, comments, shares)
  • Insights derived from the user's own post data
  • Content strategy recommendations based on provided analytics
  • Platform features such as dashboards, comparisons, AI insights, and reports

- You MUST NOT:
  • Answer general knowledge questions
  • Answer unrelated technical, academic, or personal questions
  • Provide generic advice not tied to the given analytics data
  • Act like a general-purpose chatbot

- If the user's question is OUTSIDE this scope, respond with:
  "I can only answer questions related to your social media analytics and performance data."

BEHAVIOR:
- Explain insights in clear, non-technical language
- Reference ONLY the data provided (analyticsSummary, analyticsPosts)
- Be concise, actionable, and practical
- Do NOT invent data
- Do NOT mention models, APIs, or being an AI

Your role is to behave like a dedicated AI analyst for THIS platform only.
`,
            },
            {
              role: 'user',
              content: `
USER QUESTION:
${question}

ANALYTICS SUMMARY:
${JSON.stringify(analyticsSummary ?? {}, null, 2)}

RECENT POSTS:
${JSON.stringify(analyticsPosts?.slice(0, 5) ?? [], null, 2)}
`,
            },
          ],
        }),
      }
    )

    const data = await groqRes.json()

    console.log('Groq response:', data)

    if (!groqRes.ok || data.error) {
      return NextResponse.json(
        { error: data?.error?.message || 'Groq API failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      answer: data.choices?.[0]?.message?.content ?? 'No response from AI',
    })
  } catch (error) {
    console.error('Groq AI error:', error)
    return NextResponse.json(
      { error: 'AI processing failed' },
      { status: 500 }
    )
  }
}
