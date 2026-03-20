'use client';

import { useEffect, useState } from 'react';
import { fetchPosts } from '@/lib/supabase-client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface Post {
  id: number;
  title: string;
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
  platform?: string;
}

export default function PredictionsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts().then(setPosts);
  }, []);

  /* ---------- Helpers ---------- */

  const engagement = (p: Post) =>
    p.likes * 1 + p.comments * 2 + p.shares * 3;

  /* ---------- Linear Regression ---------- */
  const regressionData = posts.map((p, i) => ({
    index: i + 1,
    engagement: engagement(p),
  }));

  const calculateRegression = () => {
    const n = regressionData.length;
    if (n < 2) return [];

    const sumX = regressionData.reduce((s, d) => s + d.index, 0);
    const sumY = regressionData.reduce((s, d) => s + d.engagement, 0);
    const sumXY = regressionData.reduce((s, d) => s + d.index * d.engagement, 0);
    const sumX2 = regressionData.reduce((s, d) => s + d.index * d.index, 0);

    const slope =
      (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return regressionData.map(d => ({
      ...d,
      predicted: slope * d.index + intercept,
    }));
  };

  const regressionLine = calculateRegression();

  /* ---------- Logistic-style Post Success ---------- */
  const postSuccessScore = (p: Post) => {
    const avgEngagement =
      posts.reduce((s, x) => s + engagement(x), 0) / posts.length;

    const score = engagement(p) / avgEngagement;

    // squash into 0–1 range (sigmoid-like)
    const probability = 1 / (1 + Math.exp(-2 * (score - 1)));

    return Math.min(Math.max(probability, 0), 1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold">📈 Predictions & Forecasting</h1>

      {/* ---------- Regression Chart ---------- */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-2">
          Engagement Trend Prediction
        </h2>

        <p className="text-gray-600 mb-4">
          This line chart shows how engagement has changed over time and
          projects future engagement using linear regression.
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={regressionLine}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="engagement"
              stroke="#6366F1"
              name="Actual Engagement"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#22C55E"
              strokeDasharray="5 5"
              name="Predicted Trend"
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="mt-4 text-sm text-gray-500">
          🧠 AI Insight: If the green dashed line slopes upward, your content
          strategy is improving. A downward slope suggests engagement fatigue.
        </p>
      </section>

      {/* ---------- Post Selector ---------- */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Post-wise Performance Checker
        </h2>

        <select
          className="border rounded-lg px-4 py-2 mb-6"
          onChange={(e) =>
            setSelectedPost(
              posts.find(p => p.id === Number(e.target.value)) || null
            )
          }
        >
          <option value="">Select a post</option>
          {posts.map(p => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {selectedPost && (
          <>
            {/* Bar Graph */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { name: 'Likes', value: selectedPost.likes },
                  { name: 'Comments', value: selectedPost.comments },
                  { name: 'Shares', value: selectedPost.shares },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>

            {/* Logistic Result */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold">
                Will this post work?
              </h3>

              <p className="mt-2 text-gray-700">
                Success Probability:{' '}
                <span className="font-bold">
                  {(postSuccessScore(selectedPost) * 100).toFixed(1)}%
                </span>
              </p>

              <p className="text-sm text-gray-500 mt-2">
                🧠 AI Insight: This probability is calculated by comparing this
                post’s engagement against your historical average using a
                logistic scoring model.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
