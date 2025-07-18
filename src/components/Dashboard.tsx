'use client';

import React, { useState, useEffect, useCallback } from 'react';
import UserManagement from './UserManagement';
import ChartContainer from './ChartContainer';
import CombinedChartContainer from './CombinedChartContainer';
import ThemeToggle from './ThemeToggle';
import { BentoGrid, BentoCard, BentoCardHeader, BentoCardContent } from './BentoGrid';
import { TrackedUser, HistoryData, ApiResponse } from '../lib/types';

export default function Dashboard() {
  const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<HistoryData[]>([]);
  const [allUsersHistory, setAllUsersHistory] = useState<Record<string, HistoryData[]>>({});
  const [viewMode, setViewMode] = useState<'individual' | 'combined'>('individual');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Load tracked users on component mount
  useEffect(() => {
    loadTrackedUsers();
  }, []);

  const loadTrackedUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log('Loading tracked users...');
      const response = await fetch('/api/users');
      const data: ApiResponse<TrackedUser[]> = await response.json();

      if (data.success) {
        console.log('Loaded tracked users:', data.data);
        setTrackedUsers(data.data || []);
      } else {
        console.error('Failed to load tracked users:', data.error);
        setTrackedUsers([]);
      }
    } catch (error) {
      console.error('Error loading tracked users:', error);
      setTrackedUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load user history when a user is selected
  useEffect(() => {
    if (selectedUser) {
      loadUserHistory(selectedUser);
    } else {
      setUserHistory([]);
    }
  }, [selectedUser]);

  const loadUserHistory = async (username: string) => {
    try {
      setIsLoadingHistory(true);
      console.log(`Loading history for user: ${username}`);
      const response = await fetch(`/api/users/${username}/history`);
      const data: ApiResponse<HistoryData[]> = await response.json();

      console.log(`History API response for ${username}:`, data);

      if (data.success) {
        console.log(`History data for ${username}:`, data.data);
        setUserHistory(data.data || []);
      } else {
        console.error('Failed to load user history:', data.error);
        setUserHistory([]);
      }
    } catch (error) {
      console.error('Error loading user history:', error);
      setUserHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadAllUsersHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const historyPromises = trackedUsers.map(async (user) => {
        const response = await fetch(`/api/users/${user.username}/history`);
        const data: ApiResponse<HistoryData[]> = await response.json();
        return {
          username: user.username,
          history: data.success ? data.data : []
        };
      });

      const results = await Promise.all(historyPromises);
      const historyMap: Record<string, HistoryData[]> = {};
      
      results.forEach(({ username, history }) => {
        historyMap[username] = history || [];
      });

      setAllUsersHistory(historyMap);
    } catch (error) {
      console.error('Error loading all users history:', error);
      setAllUsersHistory({});
    } finally {
      setIsLoadingHistory(false);
    }
  }, [trackedUsers]);

  // Load all users history for combined view
  useEffect(() => {
    if (viewMode === 'combined' && trackedUsers.length > 0) {
      loadAllUsersHistory();
    }
  }, [viewMode, trackedUsers, loadAllUsersHistory]);

  const handleUserAdded = (user: TrackedUser) => {
    console.log('Dashboard: User added:', user);
    setTrackedUsers(prev => {
      const updated = [...prev, user];
      console.log('Dashboard: Updated tracked users:', updated);
      return updated;
    });
  };

  const handleUserRemoved = (username: string) => {
    console.log('Dashboard: User removed:', username);
    setTrackedUsers(prev => {
      const updated = prev.filter(user => user.username !== username);
      console.log('Dashboard: Updated tracked users after removal:', updated);
      return updated;
    });
    
    // Clear selection if the removed user was selected
    if (selectedUser === username) {
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <BentoCard size="xl" className="mb-8" priority="high">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Reddit Karma Tracker
              </h1>
              <p className="text-lg text-secondary">
                Track Reddit user karma and post count over time
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted">
                <span>👥 {trackedUsers.length} users tracked</span>
                <span>📊 Data collected daily at 6:00 AM UTC</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle size="md" showLabel />
            </div>
          </div>
        </BentoCard>

        {/* Main Bento Grid */}
        <BentoGrid gap="gap-6">
          {/* User Management Card */}
          <BentoCard size="md" priority="high">
            <BentoCardHeader 
              title="Manage Users" 
              subtitle={isLoadingUsers ? "Loading tracked users..." : "Add and remove tracked Reddit users"}
            />
            <BentoCardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                  <span className="ml-3 text-secondary">Loading users...</span>
                </div>
              ) : (
                <UserManagement
                  onUserAdded={handleUserAdded}
                  onUserRemoved={handleUserRemoved}
                  initialUsers={trackedUsers}
                  className="!bg-transparent !shadow-none !p-0"
                />
              )}
            </BentoCardContent>
          </BentoCard>

          {/* User Selection Card */}
          {trackedUsers.length > 0 && (
            <BentoCard size="sm" priority="medium">
              <BentoCardHeader 
                title="Select User" 
                subtitle="Choose a user to view their chart"
              />
              <BentoCardContent>
                <div className="space-y-2">
                  {trackedUsers.map((user) => (
                    <button
                      key={user.username}
                      onClick={() => setSelectedUser(user.username)}
                      className={`w-full text-left p-3 rounded-md transition-theme ${
                        selectedUser === user.username
                          ? 'bg-accent-primary/10 border-2 border-accent-primary text-accent-primary'
                          : 'bg-tertiary hover:bg-accent border-2 border-transparent text-secondary'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">u/{user.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedUser && (
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="mt-3 text-sm text-muted hover:text-secondary underline transition-theme"
                  >
                    Clear selection
                  </button>
                )}
              </BentoCardContent>
            </BentoCard>
          )}

          {/* View Mode Toggle Card */}
          {trackedUsers.length > 0 && (
            <BentoCard size="sm" priority="medium">
              <BentoCardHeader 
                title="Chart View" 
                subtitle="Switch between individual and combined views"
              />
              <BentoCardContent>
                <div className="inline-flex rounded-md shadow-sm w-full">
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border transition-theme ${
                      viewMode === 'individual'
                        ? 'bg-accent-primary text-white border-accent-primary'
                        : 'bg-secondary text-secondary border-default hover:bg-tertiary'
                    }`}
                    onClick={() => setViewMode('individual')}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border transition-theme ${
                      viewMode === 'combined'
                        ? 'bg-accent-primary text-white border-accent-primary'
                        : 'bg-secondary text-secondary border-default hover:bg-tertiary'
                    } ${trackedUsers.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => trackedUsers.length >= 2 && setViewMode('combined')}
                    disabled={trackedUsers.length < 2}
                    title={trackedUsers.length < 2 ? 'Add at least 2 users to enable comparison view' : 'Compare all tracked users'}
                  >
                    Combined
                  </button>
                </div>
                {trackedUsers.length < 2 && (
                  <p className="text-xs text-muted mt-2">
                    Add at least 2 users to enable combined comparison view
                  </p>
                )}
              </BentoCardContent>
            </BentoCard>
          )}

          {/* Chart Display Card */}
          <BentoCard size="lg" priority="high">
            <BentoCardContent>
              {viewMode === 'individual' ? (
                // Individual Chart View
                selectedUser ? (
                  isLoadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
                      <span className="ml-3 text-secondary">Loading chart data for u/{selectedUser}...</span>
                    </div>
                  ) : (
                    <ChartContainer
                      data={userHistory}
                      username={selectedUser}
                      height={400}
                      className="!bg-transparent !shadow-none !p-0"
                    />
                  )
                ) : (
                  <div className="p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-primary mb-2">
                      {trackedUsers.length === 0 ? 'No Users Tracked' : 'No User Selected'}
                    </h3>
                    <p className="text-secondary mb-4">
                      {trackedUsers.length === 0 
                        ? 'Add a Reddit user to start tracking their karma and post count.'
                        : 'Select a user from the left panel to view their individual karma history chart.'
                      }
                    </p>
                    {trackedUsers.length === 0 && (
                      <p className="text-sm text-muted">
                        Charts will show historical data once users are added and data is collected.
                      </p>
                    )}
                  </div>
                )
              ) : (
                // Combined Chart View
                trackedUsers.length >= 2 ? (
                  <CombinedChartContainer
                    data={allUsersHistory}
                    height={400}
                    className="!bg-transparent !shadow-none !p-0"
                  />
                ) : (
                  <div className="p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-accent-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-primary mb-2">
                      Combined View Requires Multiple Users
                    </h3>
                    <p className="text-secondary mb-4">
                      Add at least 2 users to enable the combined comparison chart.
                    </p>
                    <p className="text-sm text-muted">
                      The combined view allows you to compare karma and post count trends across multiple users.
                    </p>
                  </div>
                )
              )}
            </BentoCardContent>
          </BentoCard>
        </BentoGrid>
      </div>
    </div>
  );
}