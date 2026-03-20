// lib/supabase-client.ts
import { supabase } from '@/lib/supabase'

// Define the Post interface here (export it)
export interface Post {
  id: number
  title: string
  content?: string
  platform?: string
  likes: number
  comments: number
  shares: number
  engagement?: number
  created_at: string
  posted_at?: string
}

// Function to fetch posts from Supabase
export const fetchPosts = async (): Promise<Post[]> => {
  try {
    console.log('📊 Fetching posts from Supabase...')
    
    // Query the posts table
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching posts:', error)
      throw error
    }
    
    console.log('✅ Posts fetched:', data?.length || 0)
    
    // If no data, return empty array
    if (!data) {
      return []
    }
    
    // Map the data with proper type assertion
    const posts = data.map((item: any) => {
      const post: Post = {
        id: item.id,
        title: item.title || `Post ${item.id}`,
        content: item.content || '',
        platform: item.platform || 'General',
        likes: Number(item.likes) || 0,
        comments: Number(item.comments) || 0,
        shares: Number(item.shares) || 0,
        engagement: item.engagement ? Number(item.engagement) : undefined,
        created_at: item.created_at || new Date().toISOString(),
        posted_at: item.posted_at || item.created_at
      };
      return post;
    }) as Post[];
    
    return posts
  } catch (error) {
    console.error('❌ Failed to fetch posts:', error)
    return [] // Return empty array on error
  }
}

// Function to calculate statistics from posts
export const calculateStats = (posts: Post[]) => {
  if (!posts || posts.length === 0) {
    return {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalEngagement: 0,
      avgEngagement: 0,
      platforms: {}
    }
  }
  
  // Calculate basic totals
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
  const totalShares = posts.reduce((sum, post) => sum + (post.shares || 0), 0);
  
  // Calculate engagement percentages for each post using the SAME formula as content.tsx
  const engagementPercentages = posts.map(post => {
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    const shares = post.shares || 0;
    
    // EXACT SAME FORMULA as content.tsx
    // Weighted engagement: (likes×1 + comments×2 + shares×3)
    const weightedEngagement = (likes * 1) + (comments * 2) + (shares * 3);
    
    let engagementPercent = 0;
    
    if (weightedEngagement >= 1000) {
      // Top 1% content
      engagementPercent = 90 + ((weightedEngagement - 1000) / 10000 * 10);
    } else if (weightedEngagement >= 300) {
      // Good content (top 10%)
      engagementPercent = 70 + ((weightedEngagement - 300) / 700 * 20);
    } else if (weightedEngagement >= 100) {
      // Average content (top 30%)
      engagementPercent = 40 + ((weightedEngagement - 100) / 200 * 30);
    } else if (weightedEngagement >= 10) {
      // Low engagement
      engagementPercent = 10 + ((weightedEngagement - 10) / 90 * 30);
    } else if (weightedEngagement > 0) {
      // Very low engagement
      engagementPercent = (weightedEngagement / 10) * 10;
    }
    
    // Apply platform-specific adjustments (SAME as content.tsx)
    let platformMultiplier = 1.0;
    const platform = post.platform || 'General';
    
    // Fix: Use exact string matching
    if (platform === 'Instagram' || platform === 'instagram') {
      platformMultiplier = 0.7;
    } else if (platform === 'Twitter' || platform === 'twitter' || platform === 'X') {
      platformMultiplier = 0.8;
    } else if (platform === 'Facebook' || platform === 'facebook') {
      platformMultiplier = 0.9;
    } else if (platform === 'LinkedIn' || platform === 'linkedin') {
      platformMultiplier = 1.2;
    }
    
    // Cap at 100% and ensure reasonable distribution
    let finalPercent = Math.min(Math.max(engagementPercent * platformMultiplier, 0), 100);
    
    // Add some randomness (SAME as content.tsx)
    const randomVariation = (Math.random() * 4) - 2;
    
    return Math.min(Math.max(finalPercent + randomVariation, 0), 100);
  });
  
  // Calculate weighted total engagement
  const totalEngagement = posts.reduce((sum, post) => {
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    const shares = post.shares || 0;
    return sum + (likes * 1 + comments * 2 + shares * 3);
  }, 0);
  
  // Calculate average engagement from the percentages
  const totalEngagementPercentage = engagementPercentages.reduce((sum, percent) => sum + percent, 0);
  const avgEngagement = posts.length > 0 ? totalEngagementPercentage / posts.length : 0;
  
  // Calculate platform distribution
  const platforms: { [key: string]: number } = {};
  posts.forEach(post => {
    const platform = post.platform || 'General';
    platforms[platform] = (platforms[platform] || 0) + 1;
  });
  
  // Debug logging
  console.log('📊 Engagement Calculation:', {
    totalPosts: posts.length,
    totalLikes,
    totalComments,
    totalShares,
    totalEngagement,
    avgEngagement: parseFloat(avgEngagement.toFixed(1)),
    samplePost: posts[0] ? {
      title: posts[0].title,
      platform: posts[0].platform,
      likes: posts[0].likes,
      comments: posts[0].comments,
      shares: posts[0].shares
    } : 'No posts'
  });
  
  return {
    totalPosts: posts.length,
    totalLikes,
    totalComments,
    totalShares,
    totalEngagement,
    avgEngagement: parseFloat(avgEngagement.toFixed(1)),
    platforms
  };
};


