// components/ReportDataFetcher.tsx
"use client";

import { useState, useEffect } from 'react';
import { fetchPosts, calculateStats } from '@/lib/supabase-client';

// Define interface locally if needed
interface ReportPost {
  id: number;
  title: string;
  platform?: string;
  likes: number;
  comments: number;
  shares: number;
  engagement?: number;
  created_at: string;
}

interface ReportData {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagement: number;
  avgEngagement: number;
  platforms: Array<{ name: string; count: number }>;
  topPosts: Array<{
    title: string;
    platform: string;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
  }>;
  posts: ReportPost[];
}

// Function to calculate engagement percentage for a single post (SAME as content.tsx)
const calculateEngagementPercentage = (post: any) => {
  const likes = Number(post.likes) || 0;
  const comments = Number(post.comments) || 0;
  const shares = Number(post.shares) || 0;
  
  // Weighted engagement: (likes×1 + comments×2 + shares×3)
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
  
  // Apply platform-specific adjustments
  let platformMultiplier = 1.0;
  switch (post.platform) {
    case 'Instagram':
      platformMultiplier = 0.7;
      break;
    case 'Twitter':
      platformMultiplier = 0.8;
      break;
    case 'Facebook':
      platformMultiplier = 0.9;
      break;
    case 'LinkedIn':
      platformMultiplier = 1.2;
      break;
    default:
      platformMultiplier = 1.0;
  }
  
  let finalPercent = Math.min(Math.max(engagementPercent * platformMultiplier, 0), 100);
  const randomVariation = (Math.random() * 4) - 2;
  
  return Math.min(Math.max(finalPercent + randomVariation, 0), 100);
};

export const useReportData = () => {
  const [data, setData] = useState<ReportData>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalEngagement: 0,
    avgEngagement: 0,
    platforms: [],
    topPosts: [],
    posts: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const posts = await fetchPosts();
      
      if (posts && posts.length > 0) {
        // Calculate stats using the SAME formula
        const stats = calculateStats(posts);
        
        // Convert platforms
        const platformsArray = Object.entries(stats.platforms || {}).map(([name, count]) => ({
          name,
          count: count as number
        }));
        
        // Calculate top posts using SAME engagement calculation
        const postsWithEngagement = posts.map(post => {
          const engagement = calculateEngagementPercentage(post);
          const weightedScore = (post.likes || 0) * 1 + (post.comments || 0) * 2 + (post.shares || 0) * 3;
          
          return {
            ...post,
            calculatedEngagement: engagement,
            weightedScore
          };
        });
        
        const topPosts = postsWithEngagement
          .sort((a, b) => b.calculatedEngagement - a.calculatedEngagement)
          .slice(0, 5)
          .map(post => ({
            title: post.title || 'Untitled',
            platform: post.platform || 'General',
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            engagement: parseFloat(post.calculatedEngagement.toFixed(1))
          }));

        setData({
          totalPosts: stats.totalPosts,
          totalLikes: stats.totalLikes,
          totalComments: stats.totalComments,
          totalShares: stats.totalShares,
          totalEngagement: stats.totalEngagement,
          avgEngagement: stats.avgEngagement,
          platforms: platformsArray,
          topPosts,
          posts: posts as ReportPost[]
        });
        
        console.log('✅ Report data calculated using SAME formula as content.tsx');
        console.log('📊 Avg Engagement:', stats.avgEngagement, '%');
      } else {
        setData({
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalEngagement: 0,
          avgEngagement: 0,
          platforms: [],
          topPosts: [],
          posts: []
        });
      }
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data from Supabase');
      
      // Fallback data with similar distribution
      const fallbackTotalEngagement = 60150 * 1 + 12250 * 2 + 3450 * 3;
      
      setData({
        totalPosts: 21,
        totalLikes: 60150,
        totalComments: 12250,
        totalShares: 3450,
        totalEngagement: fallbackTotalEngagement,
        avgEngagement: 48.2, // This would be calculated from fallback posts
        platforms: [
          { name: 'Instagram', count: 6 },
          { name: 'LinkedIn', count: 5 },
          { name: 'Facebook', count: 5 },
          { name: 'Twitter', count: 5 }
        ],
        topPosts: [
          { 
            title: 'Year End Report', 
            platform: 'LinkedIn', 
            likes: 3400, 
            comments: 780, 
            shares: 120, 
            engagement: 92.5 
          },
          { 
            title: 'Star exec hackathon', 
            platform: 'Instagram', 
            likes: 300, 
            comments: 20, 
            shares: 45, 
            engagement: 58.2 
          }
        ],
        posts: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    
    const interval = setInterval(() => {
      fetchReportData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchReportData };
};