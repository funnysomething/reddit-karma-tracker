'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    message?: string;
    config?: Record<string, unknown>;
    testResult?: Record<string, unknown>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testOAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/oauth');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testUserAdd = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'spez' }),
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary rounded-lg shadow-theme-lg p-8">
          <h1 className="text-3xl font-bold text-primary mb-6">
            Reddit Karma Tracker Setup
          </h1>

          <div className="space-y-6">
            {/* Setup Instructions */}
            <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-accent-primary mb-4">
                📋 Setup Instructions
              </h2>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium text-primary mb-2">1. Create Reddit App</h3>
                  <ul className="list-disc list-inside text-secondary space-y-1 ml-4">
                    <li>Go to: <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">https://www.reddit.com/prefs/apps</a></li>
                    <li>Click &quot;Create App&quot; or &quot;Create Another App&quot;</li>
                    <li>Select <strong>&quot;web app&quot;</strong> (not script!)</li>
                    <li>Name: Reddit Karma Tracker</li>
                    <li>About URL: https://reddit-karma-tracker.vercel.app</li>
                    <li>Redirect URI: https://reddit-karma-tracker.vercel.app/auth/callback</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-primary mb-2">2. Get Credentials</h3>
                  <ul className="list-disc list-inside text-secondary space-y-1 ml-4">
                    <li>Client ID: The string under your app name (14 characters)</li>
                    <li>Client Secret: The string after &quot;secret:&quot; (27 characters)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-primary mb-2">3. Add to Vercel</h3>
                  <ul className="list-disc list-inside text-secondary space-y-1 ml-4">
                    <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
                    <li>Add: REDDIT_CLIENT_ID = your_client_id</li>
                    <li>Add: REDDIT_CLIENT_SECRET = your_client_secret</li>
                    <li>Set for Production, Preview, and Development</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-primary mb-2">4. Redeploy</h3>
                  <ul className="list-disc list-inside text-secondary space-y-1 ml-4">
                    <li>Push any change to GitHub to trigger redeployment</li>
                    <li>Wait 1-2 minutes for deployment to complete</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="bg-tertiary rounded-lg p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">
                🧪 Test Your Setup
              </h2>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={testOAuth}
                  disabled={isLoading}
                  className="px-6 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-theme"
                >
                  {isLoading ? 'Testing...' : 'Test OAuth Setup'}
                </button>

                <button
                  onClick={testUserAdd}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-theme"
                >
                  {isLoading ? 'Testing...' : 'Test Add User (spez)'}
                </button>
              </div>

              {/* Test Results */}
              {testResult && (
                <div className="bg-primary rounded-lg p-4">
                  <h3 className="font-medium text-primary mb-2">Test Results:</h3>
                  <pre className="text-sm text-secondary overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                  
                  {testResult.success ? (
                    <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Success! Your Reddit OAuth setup is working correctly.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                      <p className="text-red-800 text-sm font-medium">
                        ❌ Setup incomplete. Please follow the instructions above.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Environment Variables Check */}
            <div className="bg-tertiary rounded-lg p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">
                🔧 Required Environment Variables
              </h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-primary rounded">
                  <span className="text-secondary">REDDIT_CLIENT_ID</span>
                  <span className="text-xs text-muted">Your Reddit app client ID</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-primary rounded">
                  <span className="text-secondary">REDDIT_CLIENT_SECRET</span>
                  <span className="text-xs text-muted">Your Reddit app client secret</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-primary rounded">
                  <span className="text-secondary">REDDIT_USER_AGENT</span>
                  <span className="text-xs text-muted">RedditKarmaTracker/1.0 (by /u/yourusername)</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="text-center pt-6 border-t border-default">
              <a
                href="/"
                className="inline-flex items-center px-6 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 transition-theme"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}