'use client';

import { useState, useEffect } from 'react';

export default function TestLeaguePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-league');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: 'Failed to fetch', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">League System Test</h1>
        
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"
        >
          {loading ? 'Testing...' : 'Run Test'}
        </button>

        {testResult && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Test Results:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
