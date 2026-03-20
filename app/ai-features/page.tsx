'use client'

import { useEffect, useState } from 'react'
import { fetchPosts, Post } from '@/lib/supabase-client'

export default function AIFeaturesPage() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    fetchPosts().then(setPosts)
  }, [])

  if (posts.length === 0) {
    return <div className="p-8">Loading AI insights…</div>
  }

  /* ---------- Helpers ---------- */
  const engagement = (p: Post) =>
    p.likes * 1 + p.comments * 2 + p.shares * 3

  const avgEngagement =
    posts.reduce((s, p) => s + engagement(p), 0) / posts.length

  /* ---------- FEATURE 1: Pattern Detector ---------- */
  const topPosts = posts
    .filter(p => engagement(p) > avgEngagement)
    .slice(0, 5)

  const commentHeavy =
    topPosts.filter(p => p.comments > p.likes).length

  /* ---------- FEATURE 2: Opportunity Gaps ---------- */
  const platformStats: Record<string, { posts: number; engagement: number }> =
    {}

  posts.forEach(p => {
    const platform = p.platform || 'General'
    if (!platformStats[platform]) {
      platformStats[platform] = { posts: 0, engagement: 0 }
    }
    platformStats[platform].posts += 1
    platformStats[platform].engagement += engagement(p)
  })

  const opportunities = Object.entries(platformStats).filter(
    ([_, v]) =>
      v.engagement / v.posts > avgEngagement && v.posts < posts.length / 3
  )

  /* ---------- FEATURE 3: Action Simulator ---------- */
  const simulatedBoost = (avgEngagement * 1.15).toFixed(0)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold">🧠 AI Strategy Engine</h1>

      {/* FEATURE 1 */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">
          1️⃣ Content Pattern Detector
        </h2>
        <p className="text-gray-600 mb-3">
          AI analyzed your top-performing posts to identify what actually drives
          engagement.
        </p>
        <p className="font-medium">
          🔍 Insight:{' '}
          {commentHeavy > topPosts.length / 2
            ? 'Posts with higher comments than likes consistently perform better.'
            : 'Likes matter more than comments for your current audience.'}
        </p>
      </section>

      {/* FEATURE 2 */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">
          2️⃣ Opportunity Gap Finder
        </h2>
        <p className="text-gray-600 mb-3">
          Identifies platforms where you are underposting but overperforming.
        </p>

        {opportunities.length === 0 ? (
          <p>✅ No major gaps detected. Your posting is well balanced.</p>
        ) : (
          <ul className="list-disc ml-6">
            {opportunities.map(([platform]) => (
              <li key={platform}>
                You could post more on <b>{platform}</b> — engagement per post
                is above average.
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FEATURE 3 */}
      <section className="bg-indigo-50 p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-2">
          3️⃣ Action Simulator
        </h2>
        <p className="text-gray-700 mb-2">
          AI simulates small strategy changes based on your historical data.
        </p>
        <p className="font-medium">
          📈 If you improve interactions (comments & shares) by ~15%, your
          average engagement could reach <b>{simulatedBoost}</b>.
        </p>
      </section>
    </div>
  )
}
