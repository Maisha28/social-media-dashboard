'use client'

import { useEffect, useState } from 'react'
import { fetchPosts, calculateStats, Post } from '@/lib/supabase-client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444']

export default function InfographicsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    fetchPosts().then(setPosts)
  }, [])

  const stats = calculateStats(posts)

  const platformData = Object.entries(stats.platforms).map(
    ([platform, count]) => ({ name: platform, value: count })
  )

  const postMetrics = selectedPost
    ? [
        { name: 'Likes', value: selectedPost.likes },
        { name: 'Comments', value: selectedPost.comments },
        { name: 'Shares', value: selectedPost.shares },
      ]
    : []

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">📊 Performance Infographics</h1>
      <p className="text-gray-600">
        Visual explanation of how your content has performed so far.
      </p>

      {/* OVERVIEW */}
      <div className="grid grid-cols-4 gap-4">
        <Stat title="Total Posts" value={stats.totalPosts} />
        <Stat title="Likes" value={stats.totalLikes} />
        <Stat title="Comments" value={stats.totalComments} />
        <Stat title="Shares" value={stats.totalShares} />
      </div>

      {/* PLATFORM DISTRIBUTION */}
      <section>
        <h2 className="text-xl font-semibold mb-2">
          Platform Distribution
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={platformData} dataKey="value" nameKey="name">
              {platformData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* POST SELECT */}
      <section>
        <h2 className="text-xl font-semibold mb-2">
          Post‑wise Performance
        </h2>
        <select
          className="border p-2 mb-4"
          onChange={(e) =>
            setSelectedPost(
              posts.find((p) => p.id === Number(e.target.value)) ||
                null
            )
          }
        >
          <option>Select a post</option>
          {posts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {selectedPost && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={postMetrics}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* AI INSIGHTS */}
      <section className="bg-indigo-50 p-6 rounded">
        <h2 className="font-semibold text-lg mb-2">🤖 AI Insights</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>LinkedIn content shows higher weighted engagement.</li>
          <li>Comments contribute more to long‑term performance.</li>
          <li>Top posts drive a disproportionate share of engagement.</li>
        </ul>
      </section>

      <Link
        href="/predictions"
        className="inline-block mt-6 text-indigo-600 font-semibold"
      >
        View AI Predictions → 
      </Link>
      <Link
  href="/ai-features"
  className="inline-block mt-4 text-indigo-600 font-semibold"
>
  Explore Advanced AI Features → 
</Link>

    </div>
  )
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white shadow rounded p-4 text-center">
      <p className="text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
