'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, getAllPosts } from '@/lib/supabase';

interface Post {
  id: number;
  title: string;
  content: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
}

interface AIInsight {
  id: number;
  title: string;
  description: string;
  category: 'performance' | 'timing' | 'content' | 'strategy' | 'optimization' | 'recommendation';
  platform: string;
  confidence: number;
  dataPoints: string[];
  impact: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
  totalPosts: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  totalEngagement: number;
  platformPerformance: { platform: string; engagement: number; posts: number }[];
  timeAnalysis: { hour: number; engagement: number; posts: number }[];
  bestPerformingContent: string[];
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  peakPerformanceHours: number[];
}

export default function AIInsightsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'analysis'>('insights');

  // Load posts data
  const loadPostsData = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading posts data from Supabase...');
      
      const postsData = await getAllPosts();
      
      console.log('📊 Posts loaded:', {
        count: postsData?.length || 0,
        sample: postsData?.[0] || 'No posts'
      });
      
      setPosts(postsData || []);
      setConnectionStatus('connected');
      
      // Analyze data if we have posts
      if (postsData && postsData.length > 0) {
        await analyzePostsData(postsData);
      } else {
        setAnalysis(null);
        setAiInsights([]);
      }
      
    } catch (error: any) {
      console.error('❌ Error loading posts:', error);
      setConnectionStatus('disconnected');
      setPosts([]);
      setAnalysis(null);
      setAiInsights([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate engagement score for a post
  const calculateEngagement = (post: Post): number => {
    const likes = Number(post.likes) || 0;
    const comments = Number(post.comments) || 0;
    const shares = Number(post.shares) || 0;
    return (likes * 1) + (comments * 2) + (shares * 3);
  };

  // Analyze posts data and generate insights
  const analyzePostsData = async (postsData: Post[]) => {
    try {
      setAnalyzing(true);
      console.log('🧠 Analyzing posts data...');
      
      if (postsData.length === 0) {
        console.log('📭 No posts to analyze');
        return;
      }

      // 1. Calculate basic statistics
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      let totalEngagement = 0;
      
      const postsWithEngagement = postsData.map(post => {
        const engagement = calculateEngagement(post);
        totalLikes += post.likes || 0;
        totalComments += post.comments || 0;
        totalShares += post.shares || 0;
        totalEngagement += engagement;
        return { ...post, engagement };
      });

      const avgLikes = totalLikes / postsData.length;
      const avgComments = totalComments / postsData.length;
      const avgShares = totalShares / postsData.length;
      const avgEngagement = totalEngagement / postsData.length;

      // 2. Analyze platform performance
      const platformStats: { [key: string]: { engagement: number; posts: number } } = {};
      
      postsWithEngagement.forEach(post => {
        const platform = post.platform || 'Unknown';
        if (!platformStats[platform]) {
          platformStats[platform] = { engagement: 0, posts: 0 };
        }
        platformStats[platform].engagement += post.engagement;
        platformStats[platform].posts += 1;
      });

      const platformPerformance = Object.entries(platformStats)
        .map(([platform, stats]) => ({
          platform,
          engagement: stats.engagement / stats.posts,
          posts: stats.posts
        }))
        .sort((a, b) => b.engagement - a.engagement);

      // 3. Analyze time performance
      const timeStats: { [key: number]: { engagement: number; posts: number } } = {};
      
      postsWithEngagement.forEach(post => {
        try {
          const hour = new Date(post.created_at).getHours();
          if (!timeStats[hour]) {
            timeStats[hour] = { engagement: 0, posts: 0 };
          }
          timeStats[hour].engagement += post.engagement;
          timeStats[hour].posts += 1;
        } catch (e) {
          // Skip invalid dates
        }
      });

      const timeAnalysis = Object.entries(timeStats)
        .map(([hour, stats]) => ({
          hour: parseInt(hour),
          engagement: stats.posts > 0 ? stats.engagement / stats.posts : 0,
          posts: stats.posts
        }))
        .sort((a, b) => b.engagement - a.engagement);

      // 4. Find best performing content
      const bestPerformingPosts = postsWithEngagement
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 3);

      const bestPerformingContent = bestPerformingPosts.map(post => 
        post.title || `Post #${post.id}`
      );

      // 5. Analyze engagement trend
      const sortedByDate = [...postsWithEngagement].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const firstHalf = sortedByDate.slice(0, Math.floor(sortedByDate.length / 2));
      const secondHalf = sortedByDate.slice(Math.floor(sortedByDate.length / 2));
      
      const avgFirstHalf = firstHalf.reduce((sum, post) => sum + post.engagement, 0) / firstHalf.length;
      const avgSecondHalf = secondHalf.reduce((sum, post) => sum + post.engagement, 0) / secondHalf.length;
      
      const engagementTrend = avgSecondHalf > avgFirstHalf ? 'increasing' : 
                             avgSecondHalf < avgFirstHalf ? 'decreasing' : 'stable';

      // 6. Find peak performance hours
      const peakPerformanceHours = timeAnalysis
        .filter(time => time.posts >= 2) // Only consider hours with at least 2 posts
        .slice(0, 3)
        .map(time => time.hour);

      // Set analysis results
      const analysisResult: AnalysisResult = {
        totalPosts: postsData.length,
        avgLikes,
        avgComments,
        avgShares,
        totalEngagement,
        platformPerformance,
        timeAnalysis,
        bestPerformingContent,
        engagementTrend,
        peakPerformanceHours
      };

      setAnalysis(analysisResult);

      // 7. Generate AI insights based on analysis
      const generatedInsights = generateAIInsights(analysisResult, postsWithEngagement);
      setAiInsights(generatedInsights);

      console.log('✅ Analysis complete:', analysisResult);
      console.log('🤖 Generated insights:', generatedInsights.length);

    } catch (error: any) {
      console.error('❌ Error analyzing data:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate AI insights from analysis
  const generateAIInsights = (analysis: AnalysisResult, posts: Post[]): AIInsight[] => {
    const insights: AIInsight[] = [];
    let insightId = 1;

    // Insight 1: Platform Performance
    if (analysis.platformPerformance.length > 1) {
      const bestPlatform = analysis.platformPerformance[0];
      const worstPlatform = analysis.platformPerformance[analysis.platformPerformance.length - 1];
      
      if (bestPlatform.engagement > worstPlatform.engagement * 1.5) {
        insights.push({
          id: insightId++,
          title: `🏆 ${bestPlatform.platform} Outperforming Other Platforms`,
          description: `${bestPlatform.platform} has ${Math.round(bestPlatform.engagement)} average engagement, which is ${Math.round((bestPlatform.engagement / worstPlatform.engagement) * 100)}% higher than ${worstPlatform.platform}. Focus your efforts here.`,
          category: 'performance',
          platform: bestPlatform.platform,
          confidence: 0.85,
          dataPoints: [
            `${bestPlatform.platform}: ${Math.round(bestPlatform.engagement)} avg engagement`,
            `${worstPlatform.platform}: ${Math.round(worstPlatform.engagement)} avg engagement`,
            `${bestPlatform.posts} posts on ${bestPlatform.platform}`
          ],
          impact: 'high'
        });
      }
    }

    // Insight 2: Peak Posting Times
    if (analysis.peakPerformanceHours.length > 0) {
      const bestHour = analysis.peakPerformanceHours[0];
      insights.push({
        id: insightId++,
        title: '⏰ Optimal Posting Times Identified',
        description: `Posts published around ${bestHour}:00 get ${Math.round(analysis.timeAnalysis.find(t => t.hour === bestHour)?.engagement || 0)}% more engagement than average. Schedule your content during peak hours.`,
        category: 'timing',
        platform: 'All Platforms',
        confidence: 0.78,
        dataPoints: analysis.peakPerformanceHours.map(hour => 
          `${hour}:00 - ${hour + 1}:00: ${Math.round(analysis.timeAnalysis.find(t => t.hour === hour)?.engagement || 0)} avg engagement`
        ),
        impact: 'medium'
      });
    }

    // Insight 3: Engagement Trend
    if (analysis.engagementTrend !== 'stable') {
      insights.push({
        id: insightId++,
        title: `📈 Engagement Trend: ${analysis.engagementTrend === 'increasing' ? 'Improving' : 'Declining'}`,
        description: `Your content engagement is ${analysis.engagementTrend}. ${analysis.engagementTrend === 'increasing' ? 'Keep up the good work!' : 'Consider revising your content strategy.'}`,
        category: 'performance',
        platform: 'All Platforms',
        confidence: 0.82,
        dataPoints: [
          `Average engagement: ${Math.round(analysis.totalEngagement / analysis.totalPosts)}`,
          `Total posts analyzed: ${analysis.totalPosts}`,
          `Trend: ${analysis.engagementTrend}`
        ],
        impact: analysis.engagementTrend === 'decreasing' ? 'high' : 'medium'
      });
    }

    // Insight 4: Content Performance
    if (analysis.bestPerformingContent.length > 0) {
      const bestPost = posts.sort((a, b) => calculateEngagement(b) - calculateEngagement(a))[0];
      insights.push({
        id: insightId++,
        title: '🚀 Top Performing Content Analysis',
        description: `Your best post "${bestPost.title?.substring(0, 40)}..." received ${calculateEngagement(bestPost)} engagement. Analyze what made this content successful.`,
        category: 'content',
        platform: bestPost.platform || 'Unknown',
        confidence: 0.9,
        dataPoints: [
          `Likes: ${bestPost.likes}`,
          `Comments: ${bestPost.comments}`,
          `Shares: ${bestPost.shares}`,
          `Total engagement score: ${calculateEngagement(bestPost)}`
        ],
        impact: 'high'
      });
    }

    // Insight 5: Engagement Distribution
    const highEngagementPosts = posts.filter(p => calculateEngagement(p) > analysis.totalEngagement / analysis.totalPosts * 1.5).length;
    const highEngagementPercentage = (highEngagementPosts / analysis.totalPosts) * 100;
    
    if (highEngagementPercentage < 30) {
      insights.push({
        id: insightId++,
        title: '🎯 Need More High-Performing Content',
        description: `Only ${Math.round(highEngagementPercentage)}% of your posts are performing above average. Focus on creating more engaging content.`,
        category: 'optimization',
        platform: 'All Platforms',
        confidence: 0.75,
        dataPoints: [
          `High-performing posts: ${highEngagementPosts}/${analysis.totalPosts}`,
          `Target: >30% high-performing content`,
          `Current: ${Math.round(highEngagementPercentage)}%`
        ],
        impact: 'medium'
      });
    }

    // Insight 6: Comments vs Likes Ratio
    const avgCommentsPerPost = analysis.avgComments;
    const avgLikesPerPost = analysis.avgLikes;
    const commentRatio = avgCommentsPerPost / avgLikesPerPost;
    
    if (commentRatio < 0.1) {
      insights.push({
        id: insightId++,
        title: '💬 Increase Audience Conversations',
        description: `Your content receives ${avgLikesPerPost.toFixed(1)} likes per post but only ${avgCommentsPerPost.toFixed(1)} comments. Try asking questions to spark discussions.`,
        category: 'strategy',
        platform: 'All Platforms',
        confidence: 0.8,
        dataPoints: [
          `Average likes: ${avgLikesPerPost.toFixed(1)}`,
          `Average comments: ${avgCommentsPerPost.toFixed(1)}`,
          `Comment-to-like ratio: ${(commentRatio * 100).toFixed(1)}%`
        ],
        impact: 'medium'
      });
    }

    // Insight 7: Platform-specific recommendations
    analysis.platformPerformance.forEach((platform, index) => {
      if (index < 3 && platform.posts >= 3) {
        insights.push({
          id: insightId++,
          title: `📱 ${platform.platform} Performance Breakdown`,
          description: `${platform.platform} has ${platform.posts} posts with average engagement of ${Math.round(platform.engagement)}. ${platform.engagement > analysis.totalEngagement / analysis.totalPosts ? 'This is above your average!' : 'Consider optimizing content for this platform.'}`,
          category: 'recommendation',
          platform: platform.platform,
          confidence: 0.88,
          dataPoints: [
            `Posts: ${platform.posts}`,
            `Avg engagement: ${Math.round(platform.engagement)}`,
            `Rank: #${index + 1} among ${analysis.platformPerformance.length} platforms`
          ],
          impact: 'medium'
        });
      }
    });

    return insights.slice(0, 10); // Limit to 10 insights
  };

  // Handle refresh
  const handleRefresh = async () => {
    await loadPostsData();
  };

  useEffect(() => {
    loadPostsData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 ml-64">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading posts data from Supabase...</p>
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
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">🤖</span>
                    AI-Powered Insights
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${connectionStatus === 'connected' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>
                      <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      {connectionStatus === 'connected' ? `Connected • ${posts.length} posts analyzed` : 'Disconnected'}
                    </span>
                    <span className="text-gray-600 text-sm">
                      Total Engagement: <span className="font-bold">{analysis?.totalEngagement.toLocaleString() || 0}</span>
                    </span>
                    <span className="text-gray-600 text-sm">
                      Avg/Post: <span className="font-bold">{analysis ? Math.round(analysis.totalEngagement / analysis.totalPosts) : 0}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('insights')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'insights' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    🧠 AI Insights
                  </button>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analysis' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    📊 Data Analysis
                  </button>
                </nav>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Analysis Status</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${posts.length > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className="font-medium">Posts Analyzed</div>
                    <div className="text-sm">{posts.length} posts loaded</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium">Analysis Status</div>
                    <div className="text-sm">{analyzing ? 'Analyzing...' : 'Analysis complete'}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-medium">Insights Generated</div>
                    <div className="text-sm">{aiInsights.length} AI insights</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">Last Analysis</div>
                    <div className="text-sm">{new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {analyzing ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Analyzing {posts.length} posts...</p>
                <p className="text-sm text-gray-400 mt-2">Generating AI-powered insights from your data</p>
              </div>
            ) : activeTab === 'insights' ? (
              // AI Insights Tab
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">🤖 AI-Generated Insights</h2>
                  <p className="text-gray-600">
                    Real-time insights generated by analyzing your {posts.length} posts
                  </p>
                </div>

                {aiInsights.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow">
                    <div className="text-5xl mb-4">🤔</div>
                    <h3 className="text-xl font-semibold mb-2">No Insights Generated</h3>
                    <p className="text-gray-600 mb-4">
                      {posts.length === 0
                        ? 'No posts found to analyze. Add some posts to get insights.'
                        : 'Could not generate insights from your data.'}
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Top Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {aiInsights.slice(0, 4).map((insight) => (
                        <div key={insight.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                insight.category === 'performance' ? 'bg-blue-100' :
                                insight.category === 'timing' ? 'bg-green-100' :
                                insight.category === 'content' ? 'bg-purple-100' :
                                insight.category === 'strategy' ? 'bg-yellow-100' :
                                insight.category === 'optimization' ? 'bg-pink-100' :
                                'bg-indigo-100'
                              }`}>
                                <span className="text-xl">
                                  {insight.category === 'performance' ? '🏆' :
                                   insight.category === 'timing' ? '⏰' :
                                   insight.category === 'content' ? '📝' :
                                   insight.category === 'strategy' ? '🎯' :
                                   insight.category === 'optimization' ? '📊' : '💡'}
                                </span>
                              </div>
                              <div>
                                <div className="flex gap-2">
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                                    {insight.category}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {insight.impact} impact
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              {Math.round(insight.confidence * 100)}% confidence
                            </div>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-2">{insight.title}</h3>
                          <p className="text-gray-600 mb-4">{insight.description}</p>
                          <div className="border-t pt-4">
                            <div className="text-xs font-medium text-gray-500 mb-2">Data Points:</div>
                            <div className="space-y-1">
                              {insight.dataPoints.map((point, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  {point}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.platform}</span>
                              <span>Generated just now</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Additional Insights */}
                    {aiInsights.length > 4 && (
                      <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Additional Insights</h3>
                        <div className="space-y-4">
                          {aiInsights.slice(4).map((insight) => (
                            <div key={insight.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                insight.category === 'performance' ? 'bg-blue-100' :
                                insight.category === 'timing' ? 'bg-green-100' :
                                insight.category === 'content' ? 'bg-purple-100' :
                                insight.category === 'strategy' ? 'bg-yellow-100' :
                                insight.category === 'optimization' ? 'bg-pink-100' :
                                'bg-indigo-100'
                              }`}>
                                <span className="text-sm">
                                  {insight.category === 'performance' ? '🏆' :
                                   insight.category === 'timing' ? '⏰' :
                                   insight.category === 'content' ? '📝' :
                                   insight.category === 'strategy' ? '🎯' :
                                   insight.category === 'optimization' ? '📊' : '💡'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {insight.impact} impact
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.platform}</span>
                                  <span>{Math.round(insight.confidence * 100)}% confidence</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // Data Analysis Tab
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">📊 Data Analysis Results</h2>
                  <p className="text-gray-600">
                    Detailed analysis of your {posts.length} posts from Supabase
                  </p>
                </div>

                {analysis ? (
                  <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white rounded-xl shadow p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-indigo-600">{analysis.totalPosts}</div>
                          <div className="text-sm text-gray-600 mt-2">Total Posts</div>
                        </div>
                      </div>
                     
                      <div className="bg-white rounded-xl shadow p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-indigo-600">{Math.round(analysis.avgLikes)}</div>
                          <div className="text-sm text-gray-600 mt-2">Avg Likes/Post</div>
                        </div>
                      </div>
                     
                      <div className="bg-white rounded-xl shadow p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-indigo-600">{Math.round(analysis.avgComments)}</div>
                          <div className="text-sm text-gray-600 mt-2">Avg Comments/Post</div>
                        </div>
                      </div>
                     
                      <div className="bg-white rounded-xl shadow p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-indigo-600">{Math.round(analysis.avgShares)}</div>
                          <div className="text-sm text-gray-600 mt-2">Avg Shares/Post</div>
                        </div>
                      </div>
                    </div>

                    {/* Platform Performance */}
                    <div className="bg-white rounded-xl shadow p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Platform Performance</h3>
                      <div className="space-y-4">
                        {analysis.platformPerformance.map((platform, index) => (
                          <div key={platform.platform} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <span className="text-indigo-600 font-bold">#{index + 1}</span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{platform.platform}</div>
                                <div className="text-sm text-gray-600">{platform.posts} posts</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-indigo-600">{Math.round(platform.engagement)}</div>
                              <div className="text-sm text-gray-600">Avg engagement</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Best Performing Content */}
                    <div className="bg-white rounded-xl shadow p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Best Performing Content</h3>
                      <div className="space-y-3">
                        {analysis.bestPerformingContent.map((content, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 font-bold">#{index + 1}</span>
                            </div>
                            <div className="text-gray-800">{content}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Time Analysis */}
                    <div className="bg-white rounded-xl shadow p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Time Analysis</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {analysis.peakPerformanceHours.map((hour) => {
                          const hourData = analysis.timeAnalysis.find(t => t.hour === hour);
                          return (
                            <div key={hour} className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{hour}:00</div>
                                <div className="text-sm text-gray-600">to {(hour + 1) % 24}:00</div>
                                <div className="mt-2 text-sm">
                                  <div className="font-medium">{hourData?.posts || 0} posts</div>
                                  <div className="text-gray-500">{Math.round(hourData?.engagement || 0)} avg engagement</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Engagement Trend */}
                    <div className="bg-white rounded-xl shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Engagement Trend</h3>
                      <div className={`p-4 rounded-lg ${
                        analysis.engagementTrend === 'increasing' ? 'bg-green-50 border border-green-200' :
                        analysis.engagementTrend === 'decreasing' ? 'bg-red-50 border border-red-200' :
                        'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              analysis.engagementTrend === 'increasing' ? 'bg-green-100' :
                              analysis.engagementTrend === 'decreasing' ? 'bg-red-100' :
                              'bg-yellow-100'
                            }`}>
                              <span className="text-xl">
                                {analysis.engagementTrend === 'increasing' ? '📈' :
                                 analysis.engagementTrend === 'decreasing' ? '📉' : '📊'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Engagement is {analysis.engagementTrend}
                              </div>
                              <div className="text-sm text-gray-600">
                                Based on analysis of {analysis.totalPosts} posts
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">
                              {Math.round(analysis.totalEngagement / analysis.totalPosts)}
                            </div>
                            <div className="text-sm text-gray-600">Avg engagement per post</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl shadow">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-2">No Data Analysis</h3>
                    <p className="text-gray-600 mb-4">
                      No posts found to analyze. Add some posts to see analysis results.
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                      Check Again
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}