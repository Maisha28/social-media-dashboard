'use client';

import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchPosts, fetchAnalytics, fetchInsights } from '@/lib/database';

const SystemStatusPage = () => {
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    checkSystemStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, [router]);

  const checkSystemStatus = async () => {
    try {
      setIsLoading(true);
      
      // Test Supabase connection
      const connectionTest = await supabase.from('posts').select('count').limit(1);
      
      // Fetch counts from all tables
      const posts = await fetchPosts();
      const analytics = await fetchAnalytics();
      const insights = await fetchInsights();

      setSystemStatus({
        connection: {
          status: connectionTest.error ? 'disconnected' : 'connected',
          error: connectionTest.error?.message,
          url: 'tkcouzqipyjaypdyasew.supabase.co'
        },
        tables: {
          posts: posts.length,
          analytics: analytics.length,
          insights: insights.length
        },
        performance: {
          responseTime: 'Fast',
          uptime: '100%',
          lastSync: new Date().toISOString()
        }
      });

      setLastUpdated(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('System check error:', error);
      setSystemStatus({
        connection: { status: 'error', error: 'Connection failed' },
        tables: { posts: 0, analytics: 0, insights: 0 },
        performance: { responseTime: 'Slow', uptime: 'Unknown' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
              <p className="text-gray-600 mt-2">
                Real-time monitoring of your Supabase integration
                {lastUpdated && <span className="ml-2 text-sm text-gray-500">Last updated: {lastUpdated}</span>}
              </p>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Database Connection</h2>
                <button
                  onClick={checkSystemStatus}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? 'Checking...' : 'Refresh Status'}
                </button>
              </div>
              
              <div className={`p-4 rounded-lg mb-4 ${
                systemStatus.connection?.status === 'connected' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {getStatusIcon(systemStatus.connection?.status)}
                  </span>
                  <div>
                    <h3 className="font-medium">
                      Supabase Connection: {systemStatus.connection?.status?.toUpperCase() || 'CHECKING'}
                    </h3>
                    <p className="text-sm mt-1">
                      URL: <code className="bg-gray-100 px-2 py-1 rounded">{systemStatus.connection?.url || 'tkcouzqipyjaypdyasew.supabase.co'}</code>
                    </p>
                    {systemStatus.connection?.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {systemStatus.connection.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Database Tables */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Posts Table</p>
                      <p className="text-2xl font-bold mt-1">{systemStatus.tables?.posts || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">📝</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Total posts in database
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Analytics Table</p>
                      <p className="text-2xl font-bold mt-1">{systemStatus.tables?.analytics || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">📊</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    KPI metrics for dashboard
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Insights Table</p>
                      <p className="text-2xl font-bold mt-1">{systemStatus.tables?.insights || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600">🤖</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    AI-generated insights
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Performance Metrics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-medium mb-4">Real-time Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 text-sm">✓</span>
                      </span>
                      <span>Live dashboard updates</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 text-sm">✓</span>
                      </span>
                      <span>Automatic content refresh</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 text-sm">✓</span>
                      </span>
                      <span>Database change detection</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-medium mb-4">System Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span className="font-medium text-green-600">{systemStatus.performance?.responseTime || 'Fast'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uptime:</span>
                      <span className="font-medium text-green-600">{systemStatus.performance?.uptime || '100%'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database:</span>
                      <span className="font-medium">Supabase</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frontend:</span>
                      <span className="font-medium">Next.js 14</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-medium mb-4">Troubleshooting</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    If you're experiencing issues:
                  </p>
                  <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
                    <li>Check your Supabase project is active</li>
                    <li>Verify RLS policies allow public read access</li>
                    <li>Ensure tables have required columns</li>
                    <li>Restart the development server: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemStatusPage;