'use client';

import React, { useState, useEffect, useCallback } from 'react';
import UserManagement from './UserManagement';
import ChartContainer from './ChartContainer';
import CombinedChartContainer from './CombinedChartContainer';
import ThemeToggle from './ThemeToggle';
import { TrackedUser, HistoryData } from '../lib/types';

export default function Dashboard() {
  // ...existing state and logic...
  const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<HistoryData[]>([]);
  const [allUsersHistory, setAllUsersHistory] = useState<Record<string, HistoryData[]>>({});
  const [viewMode, setViewMode] = useState<'individual' | 'combined'>('individual');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingAllHistory, setIsLoadingAllHistory] = useState(false);

  // Load tracked users on mount
  useEffect(() => {
    const loadTrackedUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTrackedUsers(data.data);
        } else {
          setTrackedUsers([]);
        }
      } catch {
        setTrackedUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadTrackedUsers();
  }, []);

  // Load user history when selectedUser changes
  useEffect(() => {
    if (!selectedUser) {
      setUserHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    fetch(`/api/users/${selectedUser}/history`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setUserHistory(data.data);
        } else {
          setUserHistory([]);
        }
      })
      .catch(() => setUserHistory([]))
      .finally(() => setIsLoadingHistory(false));
  }, [selectedUser]);

  // Load all users' history for combined view
  const loadAllUsersHistory = useCallback(async () => {
    if (trackedUsers.length < 2) {
      setAllUsersHistory({});
      return;
    }
    setIsLoadingAllHistory(true);
    const allHistory: Record<string, HistoryData[]> = {};
    await Promise.all(
      trackedUsers.map(async (user) => {
        try {
          const res = await fetch(`/api/users/${user.username}/history`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            allHistory[user.username] = data.data;
          } else {
            allHistory[user.username] = [];
          }
        } catch {
          allHistory[user.username] = [];
        }
      })
    );
    setAllUsersHistory(allHistory);
    setIsLoadingAllHistory(false);
  }, [trackedUsers]);

  useEffect(() => {
    if (viewMode === 'combined' && trackedUsers.length > 1) {
      loadAllUsersHistory();
    }
  }, [viewMode, trackedUsers, loadAllUsersHistory]);
  const handleUserAdded = (user: TrackedUser) => {
    setTrackedUsers(prev => {
      // Avoid duplicates
      if (prev.some(u => u.username === user.username)) return prev;
      return [...prev, user];
    });
    // Optionally auto-select the new user
    setSelectedUser(user.username);
  };
  const handleUserRemoved = (username: string) => {
    setTrackedUsers(prev => prev.filter(user => user.username !== username));
    if (selectedUser === username) setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-accent-primary drop-shadow-sm">Reddit Tracker</span>
          <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 ml-2">by funnysomething</span>
        </div>
        <ThemeToggle size="md" />
      </header>
      {/* Main content: sidebar + main area */}
      <div className="flex-1 flex flex-row w-full max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className="w-full max-w-xs min-w-[260px] bg-white/70 dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-800 px-4 py-8 flex flex-col gap-8 shadow-lg z-10">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Manage Users</h2>
            <UserManagement
              onUserAdded={handleUserAdded}
              onUserRemoved={handleUserRemoved}
              initialUsers={trackedUsers}
              className="!bg-transparent !shadow-none !p-0"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Tracked Users</h2>
            <div className="space-y-2">
              {isLoadingUsers ? (
                <div className="text-slate-400 text-sm italic">Loading users...</div>
              ) : trackedUsers.length === 0 ? (
                <div className="text-slate-400 text-sm italic">No users yet</div>
              ) : (
                trackedUsers.map((user) => (
                  <button
                    key={user.username}
                    onClick={() => setSelectedUser(user.username)}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-center gap-2 ${selectedUser === user.username ? 'bg-accent-primary/10 border border-accent-primary text-accent-primary' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
                  >
                    <span className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-base">{user.username.charAt(0).toUpperCase()}</span>
                    <span className="font-medium">u/{user.username}</span>
                  </button>
                ))
              )}
            </div>
            {selectedUser && (
              <button
                onClick={() => setSelectedUser(null)}
                className="mt-3 text-xs text-slate-400 hover:text-accent-primary underline"
              >Clear selection</button>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Chart View</h2>
            <div className="flex gap-2">
              <button
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === 'individual' ? 'bg-accent-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
                onClick={() => setViewMode('individual')}
              >Individual</button>
              <button
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === 'combined' ? 'bg-accent-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'} ${trackedUsers.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => trackedUsers.length >= 2 && setViewMode('combined')}
                disabled={trackedUsers.length < 2}
              >Combined</button>
            </div>
            <div className="mt-2 text-xs text-slate-400">{trackedUsers.length} user{trackedUsers.length !== 1 ? 's' : ''} tracked</div>
          </div>
        </aside>
        {/* Main area */}
        <main className="flex-1 flex flex-col items-center justify-start px-2 md:px-8 py-8 bg-transparent min-h-[600px]">
          <div className="w-full max-w-4xl mx-auto">
            {viewMode === 'individual' ? (
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
                    height={420}
                    className="!bg-transparent !shadow-none !p-0"
                  />
                )
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <svg className="mx-auto h-16 w-16 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">
                    {trackedUsers.length === 0 ? 'No Users Tracked' : 'No User Selected'}
                  </h3>
                  <p className="mb-4">
                    {trackedUsers.length === 0 
                      ? 'Add a Reddit user to start tracking their karma and post count.'
                      : 'Select a user from the sidebar to view their individual karma history chart.'
                    }
                  </p>
                  {trackedUsers.length === 0 && (
                    <p className="text-sm">Charts will show historical data once users are added and data is collected.</p>
                  )}
                </div>
              )
            ) : (
              trackedUsers.length >= 2 ? (
                isLoadingAllHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
                    <span className="ml-3 text-secondary">Loading combined chart data...</span>
                  </div>
                ) : (
                  <CombinedChartContainer
                    data={allUsersHistory}
                    height={420}
                    className="!bg-transparent !shadow-none !p-0"
                  />
                )
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <svg className="mx-auto h-16 w-16 text-accent-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">
                    Combined View Requires Multiple Users
                  </h3>
                  <p className="mb-4">
                    Add at least 2 users to enable the combined comparison chart.
                  </p>
                  <p className="text-sm">The combined view allows you to compare karma and post count trends across multiple users.</p>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}