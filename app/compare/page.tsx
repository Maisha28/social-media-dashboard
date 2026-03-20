'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PlatformData {
  name: string;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagement: number;
  bestPost: any;
  performance: string;
}

interface ContentTypeData {
  type: string;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagement: number;
  performance: string;
}

interface ComparisonData {
  platforms: PlatformData[];
  contentTypes: ContentTypeData[];
  overall: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagement: number;
  };
}

export default function ComparePage() {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonType, setComparisonType] = useState<'platforms' | 'contentTypes' | 'overview'>('overview');
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'engagement' | 'posts' | 'likes'>('engagement');
  const [error, setError] = useState<string | null>(null);

  // Calculate realistic engagement percentage
  const calculateEngagementPercentage = (post: any) => {
    const likes = Number(post.likes) || 0;
    const comments = Number(post.comments) || 0;
    const shares = Number(post.shares) || 0;
    
    const weightedEngagement = (likes * 1) + (comments * 2) + (shares * 3);
    
    let engagementPercent = 0;
    
    if (weightedEngagement >= 1000) {
      engagementPercent = 90 + ((weightedEngagement - 1000) / 10000 * 10);
    } else if (weightedEngagement >= 300) {
      engagementPercent = 70 + ((weightedEngagement - 300) / 700 * 20);
    } else if (weightedEngagement >= 100) {
      engagementPercent = 40 + ((weightedEngagement - 100) / 200 * 30);
    } else if (weightedEngagement >= 10) {
      engagementPercent = 10 + ((weightedEngagement - 10) / 90 * 30);
    } else if (weightedEngagement > 0) {
      engagementPercent = (weightedEngagement / 10) * 10;
    }
    
    return Math.min(Math.max(engagementPercent, 0), 100);
  };

  // Get platform color
  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'Instagram': '#E4405F',
      'Facebook': '#1877F2',
      'Twitter': '#1DA1F2',
      'LinkedIn': '#0A66C2',
    };
    return colors[platform] || '#6B7280';
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      'Instagram': '📷',
      'Facebook': '👥',
      'Twitter': '🐦',
      'LinkedIn': '💼',
    };
    return icons[platform] || '📱';
  };

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'reels': '🎬',
      'carousel': '🖼️',
      'static': '📸',
      'video': '🎥',
    };
    return icons[type] || '📄';
  };

  // Get content type color
  const getContentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'reels': '#8B5CF6',
      'carousel': '#10B981',
      'static': '#3B82F6',
      'video': '#EF4444',
    };
    return colors[type] || '#6B7280';
  };

  // Get performance label
  const getPerformanceLabel = (engagement: number) => {
    if (engagement >= 70) return 'Excellent';
    if (engagement >= 50) return 'Good';
    if (engagement >= 30) return 'Average';
    if (engagement >= 10) return 'Low';
    return 'Very Low';
  };

  // Get performance color
  const getPerformanceColor = (engagement: number) => {
    if (engagement >= 70) return '#10B981';
    if (engagement >= 50) return '#3B82F6';
    if (engagement >= 30) return '#F59E0B';
    if (engagement >= 10) return '#EF4444';
    return '#6B7280';
  };

  // Fetch comparison data from Supabase
  const fetchComparisonData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching comparison data from Supabase...');

      // Get all posts from Supabase
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        setError(`Failed to fetch posts: ${postsError.message}`);
        
        // Check if table exists
        const { data: tableCheck, error: tableError } = await supabase
          .from('posts')
          .select('id')
          .limit(1);
        
        if (tableError) {
          setError('Posts table does not exist or connection failed. Please check your Supabase setup.');
        }
        return;
      }

      console.log(`✅ Fetched ${posts?.length || 0} posts from Supabase`);

      if (!posts || posts.length === 0) {
        setError('No posts found in your database. Add some posts to see comparisons.');
        setComparisonData(null);
        return;
      }

      // Process the data
      processComparisonData(posts);
    } catch (error: any) {
      console.error('Error in comparison:', error);
      setError(`Error loading data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processComparisonData = (posts: any[]) => {
    console.log('📊 Processing comparison data...');
    
    // Initialize platform data
    const platformsData: { [key: string]: PlatformData } = {};
    
    // Initialize content type data
    const contentTypesData: { [key: string]: ContentTypeData } = {};

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalEngagement = 0;

    // Process each post
    posts.forEach((post, index) => {
      // Extract platform (check different field names)
      const platform = post.platform || post.Platform || 'Unknown';
      
      // Extract content type (check different field names)
      const contentType = post.content_type || post.contentType || post.type || 'static';
      
      const likes = Number(post.likes) || 0;
      const comments = Number(post.comments) || 0;
      const shares = Number(post.shares) || 0;
      const engagement = calculateEngagementPercentage(post);

      console.log(`Post ${index + 1}:`, {
        platform,
        contentType,
        likes,
        comments,
        shares,
        engagement
      });

      // Update platform data
      if (!platformsData[platform]) {
        platformsData[platform] = {
          name: platform,
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          avgEngagement: 0,
          bestPost: null,
          performance: ''
        };
      }

      platformsData[platform].totalPosts++;
      platformsData[platform].totalLikes += likes;
      platformsData[platform].totalComments += comments;
      platformsData[platform].totalShares += shares;
      platformsData[platform].avgEngagement += engagement;

      // Track best post for this platform
      if (!platformsData[platform].bestPost || engagement > calculateEngagementPercentage(platformsData[platform].bestPost)) {
        platformsData[platform].bestPost = post;
      }

      // Update content type data
      if (!contentTypesData[contentType]) {
        contentTypesData[contentType] = {
          type: contentType,
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          avgEngagement: 0,
          performance: ''
        };
      }

      contentTypesData[contentType].totalPosts++;
      contentTypesData[contentType].totalLikes += likes;
      contentTypesData[contentType].totalComments += comments;
      contentTypesData[contentType].totalShares += shares;
      contentTypesData[contentType].avgEngagement += engagement;

      // Update overall totals
      totalLikes += likes;
      totalComments += comments;
      totalShares += shares;
      totalEngagement += engagement;
    });

    // Calculate averages and performance
    Object.keys(platformsData).forEach(platform => {
      const data = platformsData[platform];
      if (data.totalPosts > 0) {
        data.avgEngagement = parseFloat((data.avgEngagement / data.totalPosts).toFixed(1));
        data.performance = getPerformanceLabel(data.avgEngagement);
      }
    });

    Object.keys(contentTypesData).forEach(type => {
      const data = contentTypesData[type];
      if (data.totalPosts > 0) {
        data.avgEngagement = parseFloat((data.avgEngagement / data.totalPosts).toFixed(1));
        data.performance = getPerformanceLabel(data.avgEngagement);
      }
    });

    // Convert to arrays and sort
    const platformsArray = Object.values(platformsData)
      .filter(p => p.totalPosts > 0)
      .sort((a, b) => {
        if (sortBy === 'engagement') return b.avgEngagement - a.avgEngagement;
        if (sortBy === 'posts') return b.totalPosts - a.totalPosts;
        return b.totalLikes - a.totalLikes;
      });

    const contentTypesArray = Object.values(contentTypesData)
      .filter(c => c.totalPosts > 0)
      .sort((a, b) => {
        if (sortBy === 'engagement') return b.avgEngagement - a.avgEngagement;
        if (sortBy === 'posts') return b.totalPosts - a.totalPosts;
        return b.totalLikes - a.totalLikes;
      });

    const overallAvgEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;

    console.log('📈 Processed data:', {
      platforms: platformsArray.length,
      contentTypes: contentTypesArray.length,
      overall: {
        totalPosts: posts.length,
        avgEngagement: overallAvgEngagement
      }
    });

    setComparisonData({
      platforms: platformsArray,
      contentTypes: contentTypesArray,
      overall: {
        totalPosts: posts.length,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagement: parseFloat(overallAvgEngagement.toFixed(1)),
      },
    });
  };

  useEffect(() => {
    fetchComparisonData();
  }, [timeRange, sortBy]);

  const handleRefresh = () => {
    fetchComparisonData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 ml-64">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading comparison data from Supabase...</p>
                <p className="text-sm text-gray-400 mt-2">tkcouzqipyiaypdyasew.supabase.co</p>
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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance Comparison</h1>
                <p className="text-gray-600 mt-2">
                  Compare performance across platforms and content types
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">⚠️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-red-800">Data Loading Error</h3>
                    <div className="mt-2 text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comparison Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setComparisonType('overview')}
                      className={`px-4 py-2 rounded-lg ${comparisonType === 'overview' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      📊 Overview
                    </button>
                    <button
                      onClick={() => setComparisonType('platforms')}
                      className={`px-4 py-2 rounded-lg ${comparisonType === 'platforms' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      📱 Platforms
                    </button>
                    <button
                      onClick={() => setComparisonType('contentTypes')}
                      className={`px-4 py-2 rounded-lg ${comparisonType === 'contentTypes' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      🎬 Content Types
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Range
                  </label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Time</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="7days">Last 7 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="engagement">Engagement Rate</option>
                    <option value="posts">Number of Posts</option>
                    <option value="likes">Total Likes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Database Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600">💾</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Connected to Supabase</p>
                    <p className="text-xs text-blue-700">tkcouzqipyiaypdyasew.supabase.co</p>
                  </div>
                </div>
                <div className="text-sm text-blue-700">
                  {comparisonData?.overall.totalPosts || 0} posts loaded
                </div>
              </div>
            </div>

            {comparisonData && (
              <>
                {/* Overview */}
                {comparisonType === 'overview' && (
                  <div className="space-y-8">
                    {/* Overall Stats */}
                    <div className="bg-white rounded-xl shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">📈 Overall Performance</h2>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-indigo-600">{comparisonData.overall.totalPosts}</div>
                            <div className="text-sm text-gray-600 mt-2">Total Posts</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-indigo-600">{comparisonData.overall.totalLikes.toLocaleString()}</div>
                            <div className="text-sm text-gray-600 mt-2">Total Likes</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-indigo-600">{comparisonData.overall.totalComments.toLocaleString()}</div>
                            <div className="text-sm text-gray-600 mt-2">Total Comments</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-indigo-600">{comparisonData.overall.totalShares.toLocaleString()}</div>
                            <div className="text-sm text-gray-600 mt-2">Total Shares</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-indigo-600">{comparisonData.overall.avgEngagement}%</div>
                            <div className="text-sm text-gray-600 mt-2">Avg. Engagement</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Platform vs Content Type Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Top Platforms */}
                      <div className="bg-white rounded-xl shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h2 className="text-xl font-bold text-gray-900">📱 Top Platforms</h2>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {comparisonData.platforms.slice(0, 4).map((platform, index) => (
                              <div key={platform.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: getPlatformColor(platform.name) }}
                                  >
                                    {getPlatformIcon(platform.name)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{platform.name}</div>
                                    <div className="text-sm text-gray-600">{platform.totalPosts} posts</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold" style={{ color: getPerformanceColor(platform.avgEngagement) }}>
                                    {platform.avgEngagement}%
                                  </div>
                                  <div className="text-sm" style={{ color: getPerformanceColor(platform.avgEngagement) }}>
                                    {platform.performance}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Top Content Types */}
                      <div className="bg-white rounded-xl shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h2 className="text-xl font-bold text-gray-900">🎬 Top Content Types</h2>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {comparisonData.contentTypes.slice(0, 4).map((contentType, index) => (
                              <div key={contentType.type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: getContentTypeColor(contentType.type) }}
                                  >
                                    {getContentTypeIcon(contentType.type)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{contentType.type.charAt(0).toUpperCase() + contentType.type.slice(1)}</div>
                                    <div className="text-sm text-gray-600">{contentType.totalPosts} posts</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold" style={{ color: getPerformanceColor(contentType.avgEngagement) }}>
                                    {contentType.avgEngagement}%
                                  </div>
                                  <div className="text-sm" style={{ color: getPerformanceColor(contentType.avgEngagement) }}>
                                    {contentType.performance}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Platforms Comparison */}
                {comparisonType === 'platforms' && (
                  <div className="bg-white rounded-xl shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">📱 Platform Comparison</h2>
                      <p className="text-gray-600 mt-1">Compare performance across different social platforms</p>
                    </div>
                    <div className="p-6">
                      {comparisonData.platforms.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📱</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Platform Data</h3>
                          <p className="text-gray-600">Add platform information to your posts to see comparisons.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {comparisonData.platforms.map((platform) => (
                                <tr key={platform.name} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: getPlatformColor(platform.name) }}
                                      >
                                        {getPlatformIcon(platform.name)}
                                      </div>
                                      <span className="font-medium text-gray-900">{platform.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold">{platform.totalPosts}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold text-indigo-600">{platform.totalLikes.toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold text-green-600">{platform.totalComments.toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold text-purple-600">{platform.totalShares.toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="text-lg font-bold" style={{ color: getPerformanceColor(platform.avgEngagement) }}>
                                        {platform.avgEngagement}%
                                      </div>
                                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full rounded-full"
                                          style={{ 
                                            width: `${Math.min(platform.avgEngagement, 100)}%`,
                                            backgroundColor: getPerformanceColor(platform.avgEngagement)
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span 
                                      className="px-3 py-1 rounded-full text-sm font-medium"
                                      style={{ 
                                        backgroundColor: `${getPerformanceColor(platform.avgEngagement)}20`,
                                        color: getPerformanceColor(platform.avgEngagement)
                                      }}
                                    >
                                      {platform.performance}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Types Comparison */}
                {comparisonType === 'contentTypes' && (
                  <div className="bg-white rounded-xl shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">🎬 Content Type Comparison</h2>
                      <p className="text-gray-600 mt-1">Compare performance across different content formats</p>
                    </div>
                    <div className="p-6">
                      {comparisonData.contentTypes.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🎬</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Type Data</h3>
                          <p className="text-gray-600">Add content type information to your posts to see comparisons.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {comparisonData.contentTypes.map((contentType) => (
                                <tr key={contentType.type} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: getContentTypeColor(contentType.type) }}
                                      >
                                        {getContentTypeIcon(contentType.type)}
                                      </div>
                                      <span className="font-medium text-gray-900">
                                        {contentType.type.charAt(0).toUpperCase() + contentType.type.slice(1)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold">{contentType.totalPosts}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold text-indigo-600">{contentType.totalLikes.toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold text-green-600">{contentType.totalComments.toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-lg font-bold text-purple-600">{contentType.totalShares.toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="text-lg font-bold" style={{ color: getPerformanceColor(contentType.avgEngagement) }}>
                                        {contentType.avgEngagement}%
                                      </div>
                                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full rounded-full"
                                          style={{ 
                                            width: `${Math.min(contentType.avgEngagement, 100)}%`,
                                            backgroundColor: getPerformanceColor(contentType.avgEngagement)
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span 
                                      className="px-3 py-1 rounded-full text-sm font-medium"
                                      style={{ 
                                        backgroundColor: `${getPerformanceColor(contentType.avgEngagement)}20`,
                                        color: getPerformanceColor(contentType.avgEngagement)
                                      }}
                                    >
                                      {contentType.performance}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!comparisonData && !isLoading && !error && (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Data Available</h3>
                <p className="text-gray-600 mb-6">
                  No posts found in your database. Add some posts to see comparisons.
                </p>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  🔄 Refresh Data
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}