"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PdfGenerator from '@/components/PdfGenerator';
import { useReportData } from '@/components/ReportDataFetcher';
import AnimatedCounter from '@/components/AnimatedCounter';
import EngagementGauge from '@/components/EngagementGauge';
import { supabase } from '@/lib/supabase'; // Assuming you have a supabase client
import { RealtimeChannel } from '@supabase/supabase-js';

export default function ReportsPage() {
  const { data, loading, error, refetch } = useReportData();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Set up real-time subscriptions for all relevant tables
  useEffect(() => {
    if (loading) return;

    const channels: RealtimeChannel[] = [];
    
    // Subscribe to posts table changes
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('Posts table changed:', payload);
          handleTableChange();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to posts changes');
          setIsConnected(true);
        }
      });

    channels.push(postsChannel);

    // Subscribe to likes table changes
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        (payload) => {
          console.log('Likes table changed:', payload);
          handleTableChange();
        }
      )
      .subscribe();

    channels.push(likesChannel);

    // Subscribe to comments table changes
    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          console.log('Comments table changed:', payload);
          handleTableChange();
        }
      )
      .subscribe();

    channels.push(commentsChannel);

    // Subscribe to shares table changes (if exists)
    const sharesChannel = supabase
      .channel('shares-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shares',
        },
        (payload) => {
          console.log('Shares table changed:', payload);
          handleTableChange();
        }
      )
      .subscribe();

    channels.push(sharesChannel);

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      console.log('Cleaned up all real-time subscriptions');
    };
  }, [loading]); // Only re-run when loading state changes

  const handleTableChange = () => {
    console.log('Table changed, refetching data...');
    setLastUpdated(new Date());
    refetch(); // Trigger a refetch from the hook
    
    // Show a toast notification (optional)
    showUpdateNotification();
  };

  const showUpdateNotification = () => {
    // You can implement a toast notification here
    // For example, using react-hot-toast or your own component
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right';
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Data updated! Refreshing analytics...</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-out', 'slide-out-to-right');
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 ml-64">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Loading Analytics</h2>
                  <p className="text-gray-600 mt-2">Fetching data from your Supabase database...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 ml-64">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-600">Connected to Supabase</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {data.totalPosts} posts loaded
                    </span>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        Real-time updates active
                      </span>
                    )}
                    {error && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        Using sample data
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <PdfGenerator data={data} title="Social Analytics Report" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-3xl">
                <p className="text-gray-600">
                  View your live social media analytics with real-time updates from your Supabase database.
                </p>
                <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Main Analytics Dashboard */}
            <div className="space-y-8">
              {/* Real-time status indicator */}
              {isConnected && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Real-time Updates Active</h3>
                        <p className="text-sm text-gray-600">
                          Dashboard updates automatically when your database changes
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={refetch}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Now
                    </button>
                  </div>
                </div>
              )}

              {/* Animated Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Posts Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Posts</h3>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        <AnimatedCounter value={data.totalPosts} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-blue-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Likes Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-pink-100 rounded-xl">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Likes</h3>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        <AnimatedCounter value={data.totalLikes} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-pink-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full"></div>
                  </div>
                </div>

                {/* Comments Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Comments</h3>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        <AnimatedCounter value={data.totalComments} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-emerald-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"></div>
                  </div>
                </div>

                {/* Engagement Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Avg. Engagement</h3>
                      <EngagementGauge value={data.avgEngagement} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Distribution */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Platform Distribution</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{data.totalPosts} total posts</span>
                      {isConnected && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {data.platforms.length > 0 ? (
                      data.platforms.map((platform, index) => {
                        const percentage = data.totalPosts > 0 
                          ? (platform.count / data.totalPosts) * 100 
                          : 0;
                        const colors = [
                          'bg-gradient-to-r from-pink-500 to-rose-600',
                          'bg-gradient-to-r from-blue-500 to-blue-600',
                          'bg-gradient-to-r from-indigo-500 to-purple-600',
                          'bg-gradient-to-r from-emerald-500 to-green-600',
                          'bg-gradient-to-r from-amber-500 to-orange-600'
                        ];
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length].replace('bg-gradient-to-r', 'bg-pink-500')}`}></div>
                                <span className="font-medium text-gray-900">{platform.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-gray-900">{platform.count}</span>
                                <span className="text-sm text-gray-500 ml-1">posts</span>
                              </div>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${colors[index % colors.length]}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{percentage.toFixed(1)}% of total</span>
                              <span className="text-gray-500">
                                Avg. ~{Math.round(data.totalLikes / data.totalPosts).toLocaleString()} likes per post
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-gray-500">No platform data available in your posts</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Performing Content */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Top Performing Content</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Based on engagement</span>
                      <button
                        onClick={refetch}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Refresh posts"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {data.topPosts.length > 0 ? (
                      data.topPosts.slice(0, 4).map((post, index) => {
                        const weightedScore = (post.likes * 1) + (post.comments * 2) + (post.shares * 3);
                        
                        return (
                          <div key={index} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                    {post.platform}
                                  </span>
                                  <span className="text-xs text-gray-500">Rank #{index + 1}</span>
                                </div>
                                <p className="font-medium text-gray-900 truncate">{post.title}</p>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  post.engagement >= 80 ? 'text-green-600' :
                                  post.engagement >= 60 ? 'text-blue-600' :
                                  post.engagement >= 40 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {post.engagement.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">Engagement</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="text-center p-2 bg-blue-50 rounded-lg">
                                <div className="font-bold text-blue-700">{post.likes.toLocaleString()}</div>
                                <div className="text-xs text-blue-600">Likes</div>
                              </div>
                              <div className="text-center p-2 bg-emerald-50 rounded-lg">
                                <div className="font-bold text-emerald-700">{post.comments.toLocaleString()}</div>
                                <div className="text-xs text-emerald-600">Comments</div>
                              </div>
                              <div className="text-center p-2 bg-purple-50 rounded-lg">
                                <div className="font-bold text-purple-700">{post.shares.toLocaleString()}</div>
                                <div className="text-xs text-purple-600">Shares</div>
                              </div>
                            </div>
                            
                            <div className="mt-3 text-xs text-gray-500">
                              Weighted Score: <span className="font-bold text-gray-700">{weightedScore.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-gray-500">No post data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PDF Download Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white rounded-xl shadow">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Download Complete Report</h2>
                    </div>
                    
                    <p className="text-gray-700 mb-6 max-w-2xl">
                      Generate a comprehensive PDF report with all your current analytics, 
                      platform performance metrics, engagement scores, and actionable insights 
                      based on your Supabase database.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Live metrics from your database</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Platform distribution analysis</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Top performing content review</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Engagement scoring methodology</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:pl-8 lg:border-l lg:border-blue-300">
                    <div className="text-center">
                      <PdfGenerator data={data} title="Social Analytics Report" />
                      <p className="text-sm text-gray-600 mt-3 max-w-xs">
                        Click to generate PDF with current data from your Supabase database
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Source Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Data Source
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database:</span>
                        <span className="font-medium">Supabase</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                          {isConnected ? 'Connected' : 'Connecting...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{lastUpdated.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analytics
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Posts Analyzed:</span>
                        <span className="font-medium">{data.totalPosts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Reach:</span>
                        <span className="font-medium">{(data.totalLikes + data.totalComments + (data.totalShares || 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg. Per Post:</span>
                        <span className="font-medium">{Math.round(data.totalLikes / data.totalPosts).toLocaleString()} likes</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Calculation
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Formula:</span>
                        <span className="font-medium">Weighted Score</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium">Likes×1 + Comments×2 + Shares×3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scale:</span>
                        <span className="font-medium">0-100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}