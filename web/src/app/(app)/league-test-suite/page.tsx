'use client';

import { useState } from 'react';
import { 
  testScenarios, 
  simulateLeagueStart, 
  createMockLeague,
  generateMockPlayers,
  calculateBoxConfiguration 
} from '@/utils/league-test-utils';

interface TestResult {
  scenario: string;
  players: number;
  boxes: number;
  totalMatches: number;
  boxDetails: Array<{
    name: string;
    players: number;
    matches: number;
  }>;
  executionTime: number;
}

export default function LeagueTestSuite() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customPlayerCount, setCustomPlayerCount] = useState(8);

  const runTestScenario = (scenarioName: string, scenarioFn: () => any) => {
    const startTime = performance.now();
    const scenario = scenarioFn();
    
    const league = createMockLeague(scenario.name, scenario.maxPlayers, scenario.players.length);
    const result = simulateLeagueStart(league, scenario.players);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    const boxDetails = result.boxes.map(box => {
      const boxMatches = result.matches.filter(match => match.box_id === box.id);
      return {
        name: box.name,
        players: box.current_players,
        matches: boxMatches.length,
      };
    });

    const testResult: TestResult = {
      scenario: scenarioName,
      players: scenario.players.length,
      boxes: result.boxes.length,
      totalMatches: result.totalMatches,
      boxDetails,
      executionTime,
    };

    setTestResults(prev => [testResult, ...prev]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const scenarios = [
      { name: 'Small League (4 players)', fn: testScenarios.smallLeague },
      { name: 'Medium League (8 players)', fn: testScenarios.mediumLeague },
      { name: 'Large League (16 players)', fn: testScenarios.largeLeague },
      { name: 'Full League (20 players)', fn: testScenarios.fullLeague },
      { name: 'Oversized League (32 players)', fn: testScenarios.oversizedLeague },
    ];

    for (const scenario of scenarios) {
      runTestScenario(scenario.name, scenario.fn);
      // Small delay to see progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const runCustomTest = () => {
    if (customPlayerCount < 4 || customPlayerCount > 32) {
      alert('Player count must be between 4 and 32');
      return;
    }

    const customScenario = () => ({
      name: `Custom League (${customPlayerCount} players)`,
      maxPlayers: customPlayerCount,
      players: generateMockPlayers(customPlayerCount),
    });

    runTestScenario(`Custom League (${customPlayerCount} players)`, customScenario);
  };

  const runBoxConfigurationTest = () => {
    const configs = [4, 8, 12, 16, 20, 24, 28, 32];
    const results: TestResult[] = [];

    configs.forEach(playerCount => {
      const startTime = performance.now();
      const config = calculateBoxConfiguration(playerCount);
      const players = generateMockPlayers(playerCount);
      const league = createMockLeague(`Config Test (${playerCount})`, playerCount, playerCount);
      const result = simulateLeagueStart(league, players);
      const endTime = performance.now();

      const boxDetails = result.boxes.map(box => ({
        name: box.name,
        players: box.current_players,
        matches: result.matches.filter(match => match.box_id === box.id).length,
      }));

      results.push({
        scenario: `Configuration Test (${playerCount} players)`,
        players: playerCount,
        boxes: result.boxes.length,
        totalMatches: result.totalMatches,
        boxDetails,
        executionTime: endTime - startTime,
      });
    });

    setTestResults(prev => [...results, ...prev]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">League Logic Test Suite</h1>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Tests...' : 'Run All Test Scenarios'}
            </button>

            <div className="flex gap-2">
              <input
                type="number"
                min="4"
                max="32"
                value={customPlayerCount}
                onChange={(e) => setCustomPlayerCount(parseInt(e.target.value) || 8)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Player count"
              />
              <button
                onClick={runCustomTest}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Test Custom
              </button>
            </div>

            <button
              onClick={runBoxConfigurationTest}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              Test Box Configurations
            </button>
          </div>

          <button
            onClick={clearResults}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results ({testResults.length} tests)</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Scenario</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Players</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Boxes</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Total Matches</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Execution Time</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Box Details</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {result.scenario}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {result.players}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {result.boxes}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {result.totalMatches}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {result.executionTime.toFixed(2)}ms
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="text-sm">
                          {result.boxDetails.map((box, boxIndex) => (
                            <div key={boxIndex} className="mb-1">
                              <span className="font-medium">{box.name}:</span> {box.players} players, {box.matches} matches
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Test Information */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-3">About These Tests</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Small League (4 players):</strong> Single box with 6 matches</p>
            <p><strong>Medium League (8 players):</strong> Single box with 28 matches</p>
            <p><strong>Large League (16 players):</strong> Two boxes with optimal distribution</p>
            <p><strong>Full League (20 players):</strong> Three boxes with 20 players total</p>
            <p><strong>Oversized League (32 players):</strong> Four boxes with maximum capacity</p>
            <p><strong>Box Configuration Test:</strong> Tests all player counts from 4-32 to verify optimal box distribution</p>
            <p><strong>Custom Test:</strong> Test any player count between 4-32</p>
          </div>
        </div>

        {/* Performance Metrics */}
        {testResults.length > 0 && (
          <div className="bg-green-50 rounded-lg p-6 mt-4">
            <h3 className="text-lg font-semibold mb-3">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Average Execution Time:</strong><br />
                {(testResults.reduce((sum, r) => sum + r.executionTime, 0) / testResults.length).toFixed(2)}ms
              </div>
              <div>
                <strong>Total Matches Generated:</strong><br />
                {testResults.reduce((sum, r) => sum + r.totalMatches, 0)}
              </div>
              <div>
                <strong>Total Boxes Created:</strong><br />
                {testResults.reduce((sum, r) => sum + r.boxes, 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
