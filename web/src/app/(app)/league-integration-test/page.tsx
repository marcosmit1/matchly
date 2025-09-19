'use client';

import { useState } from 'react';

interface TestResult {
  testType: string;
  playerCount: number;
  leagueName: string;
  leagueId?: string;
  steps: string[];
  errors: string[];
  success: boolean;
  boxes?: any[];
  matches?: any[];
  finalLeague?: any;
}

export default function LeagueIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customPlayerCount, setCustomPlayerCount] = useState(8);
  const [customLeagueName, setCustomLeagueName] = useState('Integration Test League');
  const [customNumberOfBoxes, setCustomNumberOfBoxes] = useState<number | null>(null);
  const [customMinPlayersPerBox, setCustomMinPlayersPerBox] = useState<number | null>(null);
  const [customMaxPlayersPerBox, setCustomMaxPlayersPerBox] = useState<number | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [leagueData, setLeagueData] = useState<any>(null);

  const runIntegrationTest = async (
    playerCount: number, 
    leagueName: string, 
    numberOfBoxes?: number | null,
    minPlayersPerBox?: number | null,
    maxPlayersPerBox?: number | null
  ) => {
    setIsRunning(true);
    
    try {
      const response = await fetch('/api/test-league-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: 'full',
          playerCount,
          leagueName,
          numberOfBoxes: numberOfBoxes || null,
          minPlayersPerBox: minPlayersPerBox || null,
          maxPlayersPerBox: maxPlayersPerBox || null,
        }),
      });

      const result = await response.json();
      setTestResults(prev => [result, ...prev]);
      
      if (result.leagueId) {
        setSelectedLeagueId(result.leagueId);
      }
    } catch (error) {
      console.error('Integration test failed:', error);
      setTestResults(prev => [{
        testType: 'error',
        playerCount,
        leagueName,
        steps: ['Test execution failed'],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        success: false
      }, ...prev]);
    } finally {
      setIsRunning(false);
    }
  };

  const fetchLeagueData = async (leagueId: string) => {
    try {
      const response = await fetch(`/api/test-league-integration?leagueId=${leagueId}`);
      const result = await response.json();
      
      if (result.success) {
        setLeagueData(result);
      } else {
        console.error('Failed to fetch league data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching league data:', error);
    }
  };

  const runQuickTests = async () => {
    const testCases = [
      { players: 4, name: 'Quick Test - Small League (Auto Boxes)', boxes: null, minPlayers: null, maxPlayers: null },
      { players: 8, name: 'Quick Test - Medium League (Auto Boxes)', boxes: null, minPlayers: null, maxPlayers: null },
      { players: 8, name: 'Quick Test - 2 Boxes', boxes: 2, minPlayers: null, maxPlayers: null },
      { players: 12, name: 'Quick Test - 3 Boxes', boxes: 3, minPlayers: null, maxPlayers: null },
      { players: 10, name: 'Quick Test - Min 3, Max 5 Players/Box', boxes: null, minPlayers: 3, maxPlayers: 5 },
      { players: 16, name: 'Quick Test - Min 4, Max 6 Players/Box', boxes: null, minPlayers: 4, maxPlayers: 6 },
    ];

    for (const testCase of testCases) {
      await runIntegrationTest(
        testCase.players, 
        testCase.name, 
        testCase.boxes,
        testCase.minPlayers,
        testCase.maxPlayers
      );
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setLeagueData(null);
    setSelectedLeagueId('');
  };

  const cleanupTestData = async (leagueId?: string) => {
    try {
      const response = await fetch('/api/cleanup-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leagueId: leagueId || null,
          cleanupAll: !leagueId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Test data cleaned up successfully!');
        clearResults();
      } else {
        alert(`Cleanup failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">League Integration Test Suite</h1>
        <p className="text-center text-gray-600 mb-8">
          This will create REAL data in your Supabase database to test the complete league workflow.
        </p>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Integration Test Controls</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Configuration Options:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Number of Boxes:</strong> Specify exact number of boxes (e.g., 2 boxes for 8 players = 4 players each)</li>
              <li>• <strong>Min/Max Players per Box:</strong> Let the system calculate optimal box count (e.g., min 3, max 5 = creates boxes with 3-5 players each)</li>
              <li>• <strong>Auto:</strong> Leave all fields empty for automatic calculation based on player count</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Player Count</label>
              <input
                type="number"
                min="4"
                max="32"
                value={customPlayerCount}
                onChange={(e) => setCustomPlayerCount(parseInt(e.target.value) || 8)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">League Name</label>
              <input
                type="text"
                value={customLeagueName}
                onChange={(e) => setCustomLeagueName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter league name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Number of Boxes (Optional)</label>
              <input
                type="number"
                min="1"
                max={customPlayerCount}
                value={customNumberOfBoxes || ''}
                onChange={(e) => setCustomNumberOfBoxes(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Auto-calculate"
              />
              <p className="text-xs text-gray-500">Leave empty for automatic calculation</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Min Players per Box (Optional)</label>
              <input
                type="number"
                min="2"
                max="8"
                value={customMinPlayersPerBox || ''}
                onChange={(e) => setCustomMinPlayersPerBox(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Auto-calculate"
              />
              <p className="text-xs text-gray-500">Minimum players per box</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Max Players per Box (Optional)</label>
              <input
                type="number"
                min="2"
                max="12"
                value={customMaxPlayersPerBox || ''}
                onChange={(e) => setCustomMaxPlayersPerBox(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Auto-calculate"
              />
              <p className="text-xs text-gray-500">Maximum players per box</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => runIntegrationTest(
                customPlayerCount, 
                customLeagueName, 
                customNumberOfBoxes,
                customMinPlayersPerBox,
                customMaxPlayersPerBox
              )}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Test...' : 'Run Custom Test'}
            </button>

            <button
              onClick={runQuickTests}
              disabled={isRunning}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Tests...' : 'Run Quick Tests (All Configurations)'}
            </button>

            <button
              onClick={clearResults}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Clear Results
            </button>

            <button
              onClick={() => cleanupTestData()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Cleanup All Test Data
            </button>
          </div>
        </div>

        {/* League Data Viewer */}
        {selectedLeagueId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">League Data Viewer</h2>
            
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter League ID"
              />
              <button
                onClick={() => fetchLeagueData(selectedLeagueId)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Fetch League Data
              </button>
            </div>

            {leagueData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-blue-600">Status</div>
                    <div className="font-semibold">{leagueData.league?.status}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm text-green-600">Boxes</div>
                    <div className="font-semibold">{leagueData.summary?.totalBoxes}</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-sm text-yellow-600">Matches</div>
                    <div className="font-semibold">{leagueData.summary?.totalMatches}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-sm text-purple-600">Participants</div>
                    <div className="font-semibold">{leagueData.summary?.totalParticipants}</div>
                  </div>
                </div>

                <details className="bg-gray-50 p-4 rounded">
                  <summary className="cursor-pointer font-medium">View Full League Data</summary>
                  <pre className="mt-4 text-xs overflow-auto bg-white p-4 rounded border">
                    {JSON.stringify(leagueData.league, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Integration Test Results ({testResults.length} tests)</h2>
            
            <div className="space-y-6">
              {testResults.map((result, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{result.leagueName}</h3>
                      <p className="text-sm text-gray-600">
                        {result.playerCount} players • {result.success ? '✅ Success' : '❌ Failed'}
                        {result.leagueId && ` • League ID: ${result.leagueId}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => result.leagueId && fetchLeagueData(result.leagueId)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Data
                      </button>
                      {result.leagueId && (
                        <button
                          onClick={() => cleanupTestData(result.leagueId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Cleanup
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Steps:</h4>
                    <ul className="text-sm space-y-1">
                      {result.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-center gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium text-red-600">Errors:</h4>
                      <ul className="text-sm text-red-600 space-y-1">
                        {result.errors.map((error, errorIndex) => (
                          <li key={errorIndex} className="flex items-center gap-2">
                            <span>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.boxes && result.boxes.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium">Created Boxes:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        {result.boxes.map((box, boxIndex) => (
                          <div key={boxIndex} className="bg-white p-2 rounded border text-sm">
                            <div className="font-medium">{box.name}</div>
                            <div className="text-gray-600">{box.current_players} players</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.matches && result.matches.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium">Created Matches: {result.matches.length}</h4>
                      <div className="text-sm text-gray-600">
                        Matches created across {result.boxes?.length || 0} boxes
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-3">How This Works</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Integration Tests:</strong> These tests create REAL data in your Supabase database.</p>
            <p><strong>What Gets Created:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>A new league with your specified parameters</li>
              <li>League participants (simulated by updating player count)</li>
              <li>League boxes (created by the start_league function)</li>
              <li>League matches (generated for each box)</li>
            </ul>
            <p><strong>Database Tables Affected:</strong> leagues, league_participants, league_boxes, league_matches</p>
            <p><strong>Note:</strong> You can view the created data in your Supabase dashboard or use the League Data Viewer above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
