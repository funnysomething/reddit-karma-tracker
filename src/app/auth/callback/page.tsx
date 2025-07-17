'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      setStatus('error');
      setMessage(`Authentication failed: ${error}`);
      return;
    }

    if (code) {
      setStatus('success');
      setMessage('Authentication successful! You can close this window.');
      
      // In a real implementation, you would send the code to your backend
      // For this app, we're using client credentials flow, so this is mainly for setup verification
      console.log('Received auth code:', code);
      console.log('State:', state);
    } else {
      setStatus('error');
      setMessage('No authorization code received');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="bg-secondary rounded-lg shadow-theme-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
          )}
          
          {status === 'success' && (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-xl font-semibold text-primary mb-4">
          {status === 'loading' && 'Processing Authentication...'}
          {status === 'success' && 'Authentication Successful!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>

        <p className="text-secondary mb-6">
          {message}
        </p>

        {status === 'success' && (
          <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-md p-4 mb-4">
            <p className="text-sm text-accent-primary">
              <strong>Note:</strong> This Reddit Karma Tracker uses server-to-server authentication, 
              so no user login is required for normal operation. This callback is mainly for 
              initial app setup verification.
            </p>
          </div>
        )}

        <button
          onClick={() => window.close()}
          className="w-full px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 transition-theme"
        >
          Close Window
        </button>

        <div className="mt-4 pt-4 border-t border-default">
          <a
            href="/"
            className="text-accent-primary hover:text-accent-primary/80 text-sm transition-theme"
          >
            ← Back to Reddit Karma Tracker
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}