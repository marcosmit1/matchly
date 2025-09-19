import { NextRequest, NextResponse } from "next/server";
import { 
  testScenarios, 
  simulateLeagueStart, 
  createMockLeague,
  generateMockPlayers,
  calculateBoxConfiguration 
} from "@/utils/league-test-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'all';
    const playerCount = parseInt(searchParams.get('players') || '0');

    const results: any[] = [];

    if (scenario === 'all') {
      // Run all test scenarios
      const scenarios = [
        { name: 'Small League (4 players)', fn: testScenarios.smallLeague },
        { name: 'Medium League (8 players)', fn: testScenarios.mediumLeague },
        { name: 'Large League (16 players)', fn: testScenarios.largeLeague },
        { name: 'Full League (20 players)', fn: testScenarios.fullLeague },
        { name: 'Oversized League (32 players)', fn: testScenarios.oversizedLeague },
      ];

      for (const testScenario of scenarios) {
        const startTime = performance.now();
        const scenarioData = testScenario.fn();
        const league = createMockLeague(scenarioData.name, scenarioData.maxPlayers, scenarioData.players.length);
        const result = simulateLeagueStart(league, scenarioData.players);
        const endTime = performance.now();

        results.push({
          scenario: testScenario.name,
          players: scenarioData.players.length,
          boxes: result.boxes.length,
          totalMatches: result.totalMatches,
          executionTime: endTime - startTime,
          boxDetails: result.boxes.map(box => ({
            name: box.name,
            players: box.current_players,
            matches: result.matches.filter(match => match.box_id === box.id).length,
          })),
        });
      }
    } else if (playerCount > 0) {
      // Test custom player count
      if (playerCount < 4 || playerCount > 32) {
        return NextResponse.json(
          { error: 'Player count must be between 4 and 32' },
          { status: 400 }
        );
      }

      const startTime = performance.now();
      const players = generateMockPlayers(playerCount);
      const league = createMockLeague(`Custom League (${playerCount} players)`, playerCount, playerCount);
      const result = simulateLeagueStart(league, players);
      const endTime = performance.now();

      results.push({
        scenario: `Custom League (${playerCount} players)`,
        players: playerCount,
        boxes: result.boxes.length,
        totalMatches: result.totalMatches,
        executionTime: endTime - startTime,
        boxDetails: result.boxes.map(box => ({
          name: box.name,
          players: box.current_players,
          matches: result.matches.filter(match => match.box_id === box.id).length,
        })),
      });
    } else {
      // Test box configurations for all player counts
      const configs = [4, 8, 12, 16, 20, 24, 28, 32];
      
      for (const count of configs) {
        const config = calculateBoxConfiguration(count);
        results.push({
          playerCount: count,
          boxes: config.boxes,
          playersPerBox: config.playersPerBox,
          remainder: config.remainder,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalTests: results.length,
        averageExecutionTime: results.length > 0 
          ? results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length 
          : 0,
        totalMatches: results.reduce((sum, r) => sum + (r.totalMatches || 0), 0),
        totalBoxes: results.reduce((sum, r) => sum + (r.boxes || 0), 0),
      },
    });

  } catch (error) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute tests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
