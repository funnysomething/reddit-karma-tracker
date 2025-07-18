import { supabase } from './supabase';
import { TrackedUser, HistoryData, ApiResponse } from './types';

// Database operations for tracked_users table
export class TrackedUsersRepository {
  static async getAll(): Promise<ApiResponse<TrackedUser[]>> {
    try {
      const { data, error } = await supabase
        .from('tracked_users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async create(username: string): Promise<ApiResponse<TrackedUser>> {
    try {
      // First, try to reactivate an existing soft-deleted user
      const { data: existingUser, error: selectError } = await supabase
        .from('tracked_users')
        .select('*')
        .eq('username', username)
        .single();

      if (existingUser && !selectError) {
        // User exists, reactivate them
        const { data, error } = await supabase
          .from('tracked_users')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('username', username)
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data };
      }

      // User doesn't exist, create new record
      const { data, error } = await supabase
        .from('tracked_users')
        .insert({ username, is_active: true })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async delete(username: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('tracked_users')
        .update({ is_active: false })
        .eq('username', username);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async exists(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tracked_users')
        .select('username')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  static async updateLastUpdated(username: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('tracked_users')
        .update({ updated_at: new Date().toISOString() })
        .eq('username', username)
        .eq('is_active', true);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Database operations for user_history table
export class UserHistoryRepository {
  static async getByUsername(username: string, limit?: number): Promise<ApiResponse<HistoryData[]>> {
    try {
      let query = supabase
        .from('user_history')
        .select('*')
        .eq('username', username)
        .order('collected_at', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async create(username: string, karma: number, postCount: number): Promise<ApiResponse<HistoryData>> {
    try {
      const { data, error } = await supabase
        .from('user_history')
        .insert({
          username,
          karma,
          post_count: postCount,
          collected_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getLatestForAllUsers(): Promise<ApiResponse<Record<string, HistoryData>>> {
    try {
      // Get the latest record for each user
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .order('collected_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      // Group by username and take the latest entry for each
      const latestData: Record<string, HistoryData> = {};
      data?.forEach(record => {
        if (!latestData[record.username]) {
          latestData[record.username] = record;
        }
      });

      return { success: true, data: latestData };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getHistoryForDateRange(
    username: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ApiResponse<HistoryData[]>> {
    try {
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('username', username)
        .gte('collected_at', startDate.toISOString())
        .lte('collected_at', endDate.toISOString())
        .order('collected_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Utility functions for data validation
export const validateUsername = (username: string): boolean => {
  // Reddit username validation: 3-20 characters, alphanumeric and underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validateKarma = (karma: number): boolean => {
  return Number.isInteger(karma) && karma >= 0;
};

export const validatePostCount = (postCount: number): boolean => {
  return Number.isInteger(postCount) && postCount >= 0;
};