export type PlatformId =
  | "instagram"
  | "facebook"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "general";

export interface Post {
  id: string;
  title: string;
  content: string;
  platform: PlatformId;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  thumbnail?: string;
  permalink?: string;
  created_at: string;
}

export interface EngagementSummary {
  totalPosts: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  /** Weighted total: likes x1 + comments x2 + shares x3 */
  weighted: number;
  /** Weighted engagement per post. */
  perPost: number;
  /** Weighted engagement as a share of reach, in percent. */
  rate: number;
  /** 0-100 health score derived from `rate`. */
  score: number;
  grade: "Exceptional" | "Strong" | "Healthy" | "Average" | "Needs work" | "No data";
}

export interface Insight {
  id: string;
  text: string;
  category: string;
  confidence: number;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  platform: PlatformId;
  username: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  connectedAt: string;
}

export interface SeriesPoint {
  date: string;
  label: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagement: number;
}
