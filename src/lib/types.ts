// Database types for Supabase tables
export interface TrackedUser {
  id: string;
  username: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface HistoryData {
  id: string;
  username: string;
  karma: number;
  post_count: number;
  comment_count: number;
  collected_at: string;
}

// Reddit API response types
export interface RedditUserData {
  username: string;
  karma: number;
  post_count: number;
  comment_count: number;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  karma: number;
  posts: number;
  comments: number;
  username: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// User management types
export interface UserManagementState {
  users: string[];
  loading: boolean;
  error: string | null;
}

// Chart component props types
export interface UserChartProps {
  username: string;
  data: HistoryData[];
  metric: 'karma' | 'posts' | 'comments';
}

export interface CombinedChartProps {
  users: string[];
  data: Record<string, HistoryData[]>;
  metric: 'karma' | 'posts' | 'comments';
}

export interface DashboardState {
  trackedUsers: string[];
  chartData: Record<string, HistoryData[]>;
  viewMode: 'individual' | 'combined';
  selectedUser: string | null;
  loading: boolean;
  error: string | null;
}

// Data collection types
export interface CollectionSummary {
  totalUsers: number;
  successfulCollections: number;
  failedCollections: number;
  errors: CollectionError[];
  collectedAt: string;
}

export interface CollectionError {
  username: string;
  error: string;
}