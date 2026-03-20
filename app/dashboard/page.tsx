'use client'

import { useState, useEffect } from 'react'
import { supabase, testSupabaseConnection, getDashboardData, generateNewInsight } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function Dashboard() {
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING')
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>({
    postsCount: 5,
    analyticsCount: 3,
    insightsCount: 3,
    engagement: { 
      likes: 958, 
      comments: 175, 
      shares: 80, 
      totalEngagement: 1508,
      engagementScore: 72,
      engagementLevel: 'High',
      performance: 'Excellent'
    },
    insights: [
      {
        id: 1,
        message: "📊 Your engagement score is 72/100 (Excellent performance)",
        category: "Performance",
        platform: "All Platforms",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        message: "🏆 Your likes are performing the best. Focus on content that drives more likes.",
        category: "Optimization",
        platform: "All Platforms",
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 3,
        message: "💬 Great conversation starter! Your audience is highly engaged in discussions.",
        category: "Engagement",
        platform: "All Platforms",
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ],
    recentPosts: [
      {
        id: 1,
        title: "Welcome to Social Dashboard",
        content: "This is a sample post showing how your dashboard displays content",
        likes: 156,
        comments: 28,
        shares: 12,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "Engagement Tips",
        content: "Learn how to improve your social media engagement with these tips",
        likes: 234,
        comments: 42,
        shares: 18,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    lastUpdated: new Date().toISOString(),
    formula: 'Weighted Total: (Likes × 1 + Comments × 2 + Shares × 3)',
    isFallbackData: true
  })
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [generatingInsight, setGeneratingInsight] = useState(false)

  useEffect(() => {
    initializeDashboard()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public' }, 
        () => {
          console.log('Database changed, refreshing...')
          loadDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const initializeDashboard = async () => {
    setLoading(true)
    console.log('🔄 Initializing dashboard...')
    
    try {
      const connection = await testSupabaseConnection()
      
      if (connection.connected) {
        setConnectionStatus('CONNECTED')
        setError(null)
        console.log('✅ Connection successful, loading data...')
        await loadDashboardData()
      } else {
        setConnectionStatus('DISCONNECTED')
        setError(connection.error || 'Failed to connect to database')
        console.error('❌ Connection failed:', connection.error)
        
        // Even if connection fails, try to load data
        await loadDashboardData()
      }
    } catch (err: any) {
      console.error('❌ Initialization error:', err)
      setConnectionStatus('DISCONNECTED')
      setError(err?.message || 'Initialization failed')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...')
      const data = await getDashboardData()
      console.log('✅ Dashboard data received:', {
        postsCount: data.postsCount,
        insightsCount: data.insightsCount,
        insightsSample: data.insights?.[0] || 'No insights',
        isFallbackData: data.isFallbackData
      })
      
      setDashboardData({
        postsCount: data.postsCount || 5,
        analyticsCount: data.analyticsCount || 3,
        insightsCount: data.insightsCount || 3,
        engagement: data.engagement || { 
          likes: 958, 
          comments: 175, 
          shares: 80, 
          totalEngagement: 1508,
          engagementScore: 72,
          engagementLevel: 'High',
          performance: 'Excellent'
        },
        insights: Array.isArray(data.insights) ? data.insights : [],
        recentPosts: Array.isArray(data.recentPosts) ? data.recentPosts : [],
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        formula: data.formula || 'Weighted Total: (Likes × 1 + Comments × 2 + Shares × 3)',
        isFallbackData: data.isFallbackData || false
      })
    } catch (err: any) {
      console.error('❌ Error loading dashboard:', err)
      setError('Failed to load dashboard data: ' + (err?.message || 'Unknown error'))
    }
  }

  const handleRefresh = async () => {
    setConnectionStatus('CONNECTING')
    setLoading(true)
    await initializeDashboard()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleGenerateInsight = async () => {
    setGeneratingInsight(true)
    try {
      console.log('🧠 Generating new insight...')
      const result = await generateNewInsight()
      if (result.success) {
        console.log('✅ Insight generated:', result.message)
        // Refresh the dashboard data
        await loadDashboardData()
      } else {
        console.error('❌ Failed to generate insight:', result.message)
      }
    } catch (err: any) {
      console.error('❌ Error generating insight:', err)
    } finally {
      setGeneratingInsight(false)
    }
  }

  // Function to get insight text safely
  const getInsightText = (insight: any) => {
    return insight?.message || insight?.insight_text || insight?.content || 'No content'
  }

  // Function to get insight category safely
  const getInsightCategory = (insight: any) => {
    return insight?.category || 'General'
  }

  // Function to get insight date safely
  const getInsightDate = (insight: any) => {
    return insight?.created_at || insight?.generated_at || new Date().toISOString()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <Sidebar />
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              ☰
            </button>
            <h1>📊 Social Media Dashboard</h1>
          </div>
          <div className="header-info">
            <span className="last-updated">
              Last updated: {dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated).toLocaleTimeString() : 'Loading...'}
              {dashboardData.isFallbackData && (
                <span className="fallback-badge"> (Sample Data)</span>
              )}
            </span>
            <button onClick={handleRefresh} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <h3>📝 Posts</h3>
            </div>
            <div className="metric-value">{dashboardData.postsCount}</div>
            <p className="metric-desc">Total posts in database</p>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3>📈 Analytics</h3>
            </div>
            <div className="metric-value">{dashboardData.analyticsCount}</div>
            <p className="metric-desc">KPI metrics tracked</p>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3>🤖 AI Insights</h3>
            </div>
            <div className="metric-value">{dashboardData.insightsCount}</div>
            <p className="metric-desc">Generated insights</p>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="engagement-section">
          <div className="section-header">
            <h2>📊 Engagement Analytics</h2>
            <div className={`performance-badge ${dashboardData.engagement?.performance?.toLowerCase() || 'average'}`}>
              {dashboardData.engagement?.performance || 'Average'} • Score: {dashboardData.engagement?.engagementScore || 50}/100
            </div>
          </div>
          
          <div className="engagement-grid">
            <div className="engagement-card">
              <div className="engagement-icon">👍</div>
              <div className="engagement-value">{(dashboardData.engagement?.likes || 0).toLocaleString()}</div>
              <div className="engagement-label">Likes</div>
              <div className="engagement-detail">Weight: 1×</div>
            </div>
            
            <div className="engagement-card">
              <div className="engagement-icon">💬</div>
              <div className="engagement-value">{(dashboardData.engagement?.comments || 0).toLocaleString()}</div>
              <div className="engagement-label">Comments</div>
              <div className="engagement-detail">Weight: 2×</div>
            </div>
            
            <div className="engagement-card">
              <div className="engagement-icon">🔄</div>
              <div className="engagement-value">{(dashboardData.engagement?.shares || 0).toLocaleString()}</div>
              <div className="engagement-label">Shares</div>
              <div className="engagement-detail">Weight: 3×</div>
            </div>
            
            <div className="engagement-card highlight">
              <div className="engagement-icon">📊</div>
              <div className="engagement-value">{(dashboardData.engagement?.totalEngagement || 0).toLocaleString()}</div>
              <div className="engagement-label">Weighted Total</div>
              <div className="engagement-detail">Engagement Score</div>
            </div>
          </div>
          
          {/* Engagement Formula Explanation */}
          <div className="formula-section">
            <h3>📐 Engagement Formula</h3>
            <div className="formula-card">
              <div className="formula-display">
                Weighted Total = <span className="formula-highlight">(Likes × 1 + Comments × 2 + Shares × 3)</span>
              </div>
              <div className="formula-explanation">
                <p>This formula gives more importance to comments and shares, as they indicate higher-quality engagement than likes.</p>
                <div className="formula-calculation">
                  <div className="calculation-step">
                    <span className="step-label">Current Calculation:</span>
                    <span className="step-value">
                      {dashboardData.engagement?.likes || 0} × 1 + {dashboardData.engagement?.comments || 0} × 2 + {dashboardData.engagement?.shares || 0} × 3 = {dashboardData.engagement?.totalEngagement || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="posts-section">
          <div className="section-header">
            <h2>📝 Recent Posts</h2>
            <button className="view-all-btn">View All →</button>
          </div>
          
          <div className="posts-grid">
            {dashboardData.recentPosts && dashboardData.recentPosts.length > 0 ? (
              dashboardData.recentPosts.map((post: any, index: number) => (
                <div key={post.id || index} className="post-card">
                  <div className="post-header">
                    <div className="post-title">{post.title || `Post ${index + 1}`}</div>
                    <div className="post-date">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <div className="post-content">
                    {post.content ? 
                      (post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content) 
                      : 'No content available'}
                  </div>
                  <div className="post-stats">
                    <div className="stat">
                      <span className="stat-icon">👍</span>
                      <span className="stat-value">{post.likes?.toLocaleString() || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">💬</span>
                      <span className="stat-value">{post.comments?.toLocaleString() || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">🔄</span>
                      <span className="stat-value">{post.shares?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-posts">
                <p>No posts found in the database.</p>
                <button className="create-post-btn">Create First Post</button>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="insights-section">
          <div className="section-header">
            <h2>🤖 AI-Generated Insights</h2>
            <div className="insights-actions">
              <button 
                onClick={handleGenerateInsight}
                disabled={generatingInsight}
                className="generate-insight-btn"
              >
                {generatingInsight ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  '🧠 Generate New Insight'
                )}
              </button>
            </div>
          </div>
          
          {dashboardData.isFallbackData && (
            <div className="info-message">
              <span className="info-icon">ℹ️</span>
              <span>Showing sample insights. Click "Generate New Insight" for personalized analysis.</span>
            </div>
          )}
          
          {dashboardData.insights && dashboardData.insights.length > 0 ? (
            <>
              <div className="insights-container">
                <div className="insights-list">
                  {dashboardData.insights.slice(0, 5).map((insight: any, index: number) => (
                    <div key={insight.id || `insight-${index}`} className="insight-card">
                      <div className="insight-header">
                        <div className="insight-number">#{index + 1}</div>
                        <div className="insight-meta">
                          <span className="insight-category">
                            {getInsightCategory(insight)}
                          </span>
                          <span className="insight-platform">
                            {insight.platform || 'All Platforms'}
                          </span>
                        </div>
                      </div>
                      <div className="insight-content">
                        {getInsightText(insight)}
                      </div>
                      <div className="insight-footer">
                        <div className="insight-time">
                          {getInsightDate(insight) ? (
                            <>
                              {new Date(getInsightDate(insight)).toLocaleDateString()} at{' '}
                              {new Date(getInsightDate(insight)).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </>
                          ) : 'Just now'}
                        </div>
                        <div className="insight-source">
                          {dashboardData.isFallbackData ? 'Sample Data' : 'From Supabase'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="insights-footer">
                <p className="insights-note">
                  Insights are generated by analyzing your post engagement data using AI algorithms.
                </p>
              </div>
            </>
          ) : (
            <div className="no-insights">
              <div className="no-insights-icon">🔍</div>
              <div className="no-insights-content">
                <h3>No Insights Available</h3>
                <p>Click "Generate New Insight" to analyze your data and create AI-powered recommendations.</p>
              </div>
            </div>
          )}
        </div>

        {/* Debug Information - Removed from user view but kept in code */}
        {process.env.NODE_ENV === 'development' && (
          <details className="debug-info">
            <summary>Debug Information</summary>
            <div className="debug-content">
              <div className="debug-grid">
                <div className="debug-item">
                  <div className="debug-label">Connection Status</div>
                  <div className="debug-value">{connectionStatus}</div>
                </div>
                <div className="debug-item">
                  <div className="debug-label">Posts Count</div>
                  <div className="debug-value">{dashboardData.postsCount}</div>
                </div>
                <div className="debug-item">
                  <div className="debug-label">Insights Count</div>
                  <div className="debug-value">{dashboardData.insightsCount}</div>
                </div>
                <div className="debug-item">
                  <div className="debug-label">Engagement Score</div>
                  <div className="debug-value">{dashboardData.engagement?.engagementScore || 0}/100</div>
                </div>
                <div className="debug-item">
                  <div className="debug-label">Using Sample Data</div>
                  <div className="debug-value">{dashboardData.isFallbackData ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              {error && (
                <div className="debug-item mt-4">
                  <div className="debug-label">Error</div>
                  <div className="debug-value text-xs text-red-500">{error}</div>
                </div>
              )}
              
              <div className="debug-actions">
                <button 
                  onClick={() => {
                    console.log('Dashboard Data:', dashboardData)
                    console.log('First insight:', dashboardData.insights?.[0])
                    console.log('Connection Status:', connectionStatus)
                    console.log('Error:', error)
                  }}
                  className="debug-btn"
                >
                  Log Data to Console
                </button>
              </div>
            </div>
          </details>
        )}
        
        <button
          onClick={handleRefresh}
          className="refresh-bottom-btn"
        >
          🔄 Refresh All Data
        </button>
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100%;
          background: #f5f7fa;
        }

        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0070f3;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
        }

        .sidebar {
          width: 250px;
          background: #1a1a2e;
          color: white;
          transition: all 0.3s ease;
          position: relative;
          height: 100vh;
          overflow-y: auto;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
        }

        .sidebar.closed {
          transform: translateX(-250px);
        }

        .sidebar-toggle {
          position: absolute;
          right: -20px;
          top: 20px;
          background: #1a1a2e;
          color: white;
          border: none;
          width: 20px;
          height: 40px;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-content {
          flex: 1;
          margin-left: ${sidebarOpen ? '250px' : '0'};
          transition: margin-left 0.3s ease;
          padding: 24px;
          max-width: calc(100vw - ${sidebarOpen ? '250px' : '0'});
          overflow-x: hidden;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .menu-toggle {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #333;
          padding: 8px;
          border-radius: 6px;
          display: none;
        }

        .menu-toggle:hover {
          background: #f5f5f5;
        }

        .dashboard-header h1 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .last-updated {
          color: #666;
          font-size: 14px;
        }

        .fallback-badge {
          background: #fff3cd;
          color: #856404;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }

        .refresh-btn {
          background: #0070f3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .refresh-btn:hover {
          background: #0051cc;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }

        .metric-card {
          background: white;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .metric-header {
          margin-bottom: 16px;
        }

        .metric-header h3 {
          margin: 0;
          color: #495057;
          font-size: 18px;
        }

        .metric-value {
          font-size: 48px;
          font-weight: 700;
          color: #0070f3;
          margin: 16px 0;
          line-height: 1;
        }

        .metric-desc {
          color: #6c757d;
          margin: 0;
          font-size: 14px;
        }

        .engagement-section,
        .posts-section,
        .insights-section {
          margin: 40px 0;
          padding: 30px;
          background: white;
          border-radius: 12px;
          border: 1px solid #eaeaea;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .performance-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .performance-badge.excellent {
          background: #d4edda;
          color: #155724;
        }

        .performance-badge.good {
          background: #fff3cd;
          color: #856404;
        }

        .performance-badge.average {
          background: #d1ecf1;
          color: #0c5460;
        }

        .performance-badge.low {
          background: #f8d7da;
          color: #721c24;
        }

        .performance-badge.no-data {
          background: #e2e3e5;
          color: #383d41;
        }

        .engagement-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .engagement-card {
          background: white;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          transition: all 0.2s;
        }

        .engagement-card.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .engagement-card.highlight .engagement-value,
        .engagement-card.highlight .engagement-label,
        .engagement-card.highlight .engagement-detail {
          color: white;
        }

        .engagement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }

        .engagement-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .engagement-value {
          font-size: 32px;
          font-weight: 700;
          color: #0070f3;
          margin: 8px 0;
        }

        .engagement-card.highlight .engagement-value {
          color: white;
        }

        .engagement-label {
          color: #6c757d;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .engagement-detail {
          color: #adb5bd;
          font-size: 12px;
          font-weight: 400;
        }

        .formula-section {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          border-left: 4px solid #0070f3;
        }

        .formula-section h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
        }

        .formula-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          border: 1px solid #dee2e6;
        }

        .formula-display {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 15px;
          border: 1px solid #e9ecef;
        }

        .formula-highlight {
          color: #0070f3;
          font-weight: bold;
          background: #e7f1ff;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .formula-explanation p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 15px;
        }

        .formula-calculation {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .calculation-step {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #495057;
        }

        .step-label {
          font-weight: 600;
          margin-right: 10px;
        }

        .step-value {
          color: #0070f3;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h2 {
          margin: 0;
          color: #333;
        }

        .view-all-btn {
          background: none;
          border: 1px solid #0070f3;
          color: #0070f3;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-all-btn:hover {
          background: #0070f3;
          color: white;
        }

        /* Posts Grid */
        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .post-card {
          background: white;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
        }

        .post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
          border-color: #0070f3;
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .post-title {
          font-weight: 600;
          color: #333;
          font-size: 16px;
        }

        .post-date {
          color: #6c757d;
          font-size: 12px;
        }

        .post-content {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .post-stats {
          display: flex;
          gap: 20px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 14px;
        }

        .stat-icon {
          font-size: 16px;
        }

        .stat-value {
          font-weight: 600;
        }

        .no-posts {
          text-align: center;
          padding: 40px;
          color: #6c757d;
          grid-column: 1 / -1;
        }

        .create-post-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          margin-top: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .create-post-btn:hover {
          background: #218838;
        }

        /* Insights Actions */
        .insights-actions {
          display: flex;
          gap: 10px;
        }

        .generate-insight-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        .generate-insight-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .generate-insight-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Insights List */
        .insights-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .insight-card {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .insight-card:hover {
          background: #e9ecef;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .insight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .insight-number {
          background: #0070f3;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .insight-meta {
          display: flex;
          gap: 8px;
        }
        
        .insight-category,
        .insight-platform {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .insight-category {
          background-color: #e0f2fe;
          color: #0369a1;
        }
        
        .insight-platform {
          background-color: #dcfce7;
          color: #166534;
        }

        .insight-content {
          color: #333;
          line-height: 1.6;
          font-size: 15px;
          margin: 12px 0;
        }

        .insight-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #6c757d;
          padding-top: 12px;
          border-top: 1px solid #e9ecef;
        }

        .insight-source {
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .no-insights {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .no-insights-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .no-insights-content h3 {
          color: #495057;
          margin-bottom: 12px;
        }

        .no-insights-content p {
          margin-bottom: 20px;
          max-width: 500px;
          line-height: 1.6;
        }

        .insights-footer {
          margin-top: 20px;
          text-align: center;
        }

        .insights-note {
          color: #6c757d;
          font-size: 13px;
          font-style: italic;
        }

        .info-message {
          background: #d1ecf1;
          color: #0c5460;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #bee5eb;
        }

        .info-icon {
          font-size: 18px;
        }

        /* Debug Info */
        .debug-info {
          margin-top: 40px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          border: 1px solid #dee2e6;
        }

        .debug-info summary {
          cursor: pointer;
          color: #0070f3;
          font-weight: 500;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          outline: none;
        }

        .debug-info summary:hover {
          background: #f8f9fa;
        }

        .debug-content {
          margin-top: 16px;
          padding: 16px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .debug-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .debug-item {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .debug-label {
          color: #6c757d;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .debug-value {
          font-weight: 600;
          color: #333;
          margin-top: 5px;
        }

        .debug-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .debug-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .debug-btn:hover {
          background: #5a6268;
        }

        .refresh-bottom-btn {
          background: #0070f3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          width: 100%;
          margin-top: 30px;
          transition: background 0.2s;
        }

        .refresh-bottom-btn:hover {
          background: #0051cc;
        }

        .text-xs {
          font-size: 12px;
        }

        .text-red-500 {
          color: #ef4444;
        }

        .mt-4 {
          margin-top: 16px;
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-250px);
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .main-content {
            margin-left: 0;
            max-width: 100vw;
          }
          
          .menu-toggle {
            display: block;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .insights-actions {
            width: 100%;
          }
          
          .generate-insight-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .header-info {
            width: 100%;
            justify-content: space-between;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .engagement-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .posts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .engagement-grid {
            grid-template-columns: 1fr;
          }
          
          .main-content {
            padding: 16px;
          }
          
          .engagement-section,
          .posts-section,
          .insights-section {
            padding: 20px;
          }
          
          .debug-actions {
            flex-direction: column;
          }
          
          .debug-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}