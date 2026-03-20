'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestConnection() {
  const [status, setStatus] = useState('Testing connection...');
  const [posts, setPosts] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Test 1: Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .limit(5);

      if (postsError) throw postsError;

      // Test 2: Count total posts
      const { count: postsCount, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      setPosts(postsData || []);
      setStatus(`✅ Connected! Found ${postsCount || 0} posts in database`);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Supabase Connection Test
        </h1>
        <p className="text-gray-600 mb-6">
          Project ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">tkcouzqipyjaypdyasew</span>
        </p>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Connection Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.includes('✅') ? 'Connected' : 'Error'}
            </span>
          </div>
          
          <div className={`p-4 rounded-lg ${
            status.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className="font-medium">{status}</div>
          </div>

          {/* Connection Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Environment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">Project URL:</span>
                  <span className="font-mono text-blue-600">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">API Key:</span>
                  <span className="font-mono text-green-600">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Database Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">Posts Table:</span>
                  <span className="font-mono">✅ Exists ({posts.length} shown)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">Connection:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Display */}
        {posts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Posts from Supabase</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {posts.length} posts loaded
              </span>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          post.platform === 'Twitter' ? 'bg-blue-100 text-blue-800' :
                          post.platform === 'Facebook' ? 'bg-blue-600 text-white' :
                          post.platform === 'LinkedIn' ? 'bg-blue-800 text-white' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.platform}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {post.type}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">{post.title}</h3>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        {post.likes && (
                          <span className="flex items-center">
                            <span className="mr-1">👍</span>
                            {post.likes} likes
                          </span>
                        )}
                        {post.comments && (
                          <span className="flex items-center">
                            <span className="mr-1">💬</span>
                            {post.comments} comments
                          </span>
                        )}
                        {post.shares && (
                          <span className="flex items-center">
                            <span className="mr-1">🔄</span>
                            {post.shares} shares
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">ID: {post.id.substring(0, 8)}...</div>
                      {post.posted_at && (
                        <div className="text-sm text-gray-600">{new Date(post.posted_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/content"
              className="block p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
            >
              <div className="font-medium text-indigo-700">📱 Go to Content Page</div>
              <p className="text-sm text-indigo-600 mt-1">View all posts with real data</p>
            </a>
            
            <a
              href="https://tkcouzqipyjaypdyasew.supabase.co"
              target="_blank"
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <div className="font-medium text-blue-700">🔗 Open Supabase Dashboard</div>
              <p className="text-sm text-blue-600 mt-1">Manage your database</p>
            </a>
            
            <a
              href="/dashboard"
              className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
            >
              <div className="font-medium text-green-700">📊 Go to Dashboard</div>
              <p className="text-sm text-green-600 mt-1">View analytics with real data</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}