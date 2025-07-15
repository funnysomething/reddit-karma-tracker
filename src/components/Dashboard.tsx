'use client';

import React, { useState, useEffect, useCallback } from 'react';
import UserManagement from './UserManagement';
import ChartContainer from './ChartContainer';
import CombinedChartContainer from './CombinedChartContainer';
import { TrackedUser, HistoryData, ApiResponse } from '../lib/types';

export default function Dashboard() {
  const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<HistoryData[]>([]);
  const [allUsersHistory, setAllUsersHistory] = useState<Record<string, HistoryData[]>>({});
  const [viewMode, setViewMode] = useState<'individual' | 'combined'>('individual');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Suppress unused variable warning - will be used for loading states in future
  void isLoadingHistory;

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
      const response = await fetch(`/api/users/${username}/history`);
      const data: ApiResponse<HistoryData[]> = await response.json();

      if (data.success) {
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
    setTrackedUsers(prev => [...prev, user]);
  };

  const handleUserRemoved = (username: string) => {
    setTrackedUsers(prev => prev.filter(user => user.username !== username));
    
    // Clear selection if the removed user was selected
    if (selectedUser === username) {
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reddit Karma Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Track Reddit user karma and post count over time
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management Panel */}
          <div className="lg:col-span-1">
            <UserManagement
              onUserAdded={handleUserAdded}
              onUserRemoved={handleUserRemoved}
            />
            
            {/* User Selection */}
            {trackedUsers.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  Select User to View Chart
                </h3>
                <div className="space-y-2">
                  {trackedUsers.map((user) => (
                    <button
                      key={user.username}
                      onClick={() => setSelectedUser(user.username)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedUser === user.username
                          ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
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
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Chart Panel */}
          <div className="lg:col-span-2">
            {/* View Mode Toggle */}
            {trackedUsers.length > 0 && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg font-medium text-gray-700">
                    Chart View
                  </h3>
                  <div className="inline-flex rounded-md shadow-sm">
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                        viewMode === 'individual'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setViewMode('individual')}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                        viewMode === 'combined'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } ${trackedUsers.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => trackedUsers.length >= 2 && setViewMode('combined')}
                      disabled={trackedUsers.length < 2}
                      title={trackedUsers.length < 2 ? 'Add at least 2 users to enable comparison view' : 'Compare all tracked users'}
                    >
                      Combined
                    </button>
                  </div>
                </div>
                {trackedUsers.length < 2 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Add at least 2 users to enable combined comparison view
                  </p>
                )}
              </div>
            )}

            {/* Chart Content */}
            {viewMode === 'individual' ? (
              // Individual Chart View
              selectedUser ? (
                <ChartContainer
                  data={userHistory}
                  username={selectedUser}
                  height={400}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {trackedUsers.length === 0 ? 'No Users Tracked' : 'No User Selected'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {trackedUsers.length === 0 
                      ? 'Add a Reddit user to start tracking their karma and post count.'
                      : 'Select a user from the left panel to view their individual karma history chart.'
                    }
                  </p>
                  {trackedUsers.length === 0 && (
                    <p className="text-sm text-gray-400">
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
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Combined View Requires Multiple Users
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add at least 2 users to enable the combined comparison chart.
                  </p>
                  <p className="text-sm text-gray-400">
                    The combined view allows you to compare karma and post count trends across multiple users.
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Data is automatically collected daily at 6:00 AM UTC. 
            Charts will populate as historical data is gathered.
          </p>
        </div>
      </div>
    </div>
  );
}