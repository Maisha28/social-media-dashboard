'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface AnalysisData {
  posts: any[]
  summary: any
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text:
        "Hi! I'm your AI Social Media Analytics Assistant.\n\n" +
        "I can analyze your data, explain concepts, answer strategy questions, " +
        "and help with anything related to social media analytics.\n\n" +
        "Ask me anything.",
      sender: 'ai',
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ================= DATA LOAD =================
  const loadAnalytics = async () => {
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (!posts || posts.length === 0) return

    setAnalysisData({
      posts,
      summary: {
        totalPosts: posts.length,
      },
    })
  }

  // ================= MESSAGE HELPERS =================
  const addMessage = (text: string, sender: 'user' | 'ai') => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        sender,
        timestamp: new Date(),
      },
    ])
  }

  // ================= SEND MESSAGE =================
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    addMessage(userMessage, 'user')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          analyticsSummary: analysisData?.summary,
          analyticsPosts: analysisData?.posts,
        }),
      })

      const data = await res.json()
      addMessage(data.answer ?? 'No response from AI.', 'ai')
    } catch (error) {
      addMessage(
        'There was an error talking to the AI. Please try again.',
        'ai'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow border">

          {/* HEADER */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold">AI Analytics Assistant</h1>
            <p className="text-sm text-gray-600">
              Generative AI powered insights from your Supabase data
            </p>
          </div>

          {/* CHAT */}
          <div className="h-[520px] overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-5 py-3 rounded-xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div className="text-xs mt-2 opacity-60">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="text-gray-500 text-sm">AI is thinking...</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="border-t p-4 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your analytics, strategy, or concepts..."
              className="flex-1 border rounded-lg px-4 py-3"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
