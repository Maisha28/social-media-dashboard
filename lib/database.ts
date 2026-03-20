import { supabase } from './supabase';

// Fetch all posts
export const fetchPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('posted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

// Fetch analytics data
export const fetchAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
};

// Fetch insights
export const fetchInsights = async () => {
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching insights:', error);
    return [];
  }
};

// Calculate statistics from posts
export const calculateStats = (posts: any[]) => {
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
  const totalShares = posts.reduce((sum, post) => sum + (post.shares || 0), 0);
  const avgEngagement = posts.length > 0 
    ? posts.reduce((sum, post) => sum + (post.engagement || 0), 0) / posts.length 
    : 0;
  
  // Platform distribution
  const platforms: Record<string, number> = {};
  posts.forEach(post => {
    platforms[post.platform] = (platforms[post.platform] || 0) + 1;
  });

  return {
    totalLikes,
    totalComments,
    totalShares,
    avgEngagement: parseFloat(avgEngagement.toFixed(2)),
    totalPosts: posts.length,
    platforms
  };
};