import {
  calculateBoxConfiguration,
  generateMockPlayers,
  createMockLeague,
  createMockBoxes,
  generateRoundRobinMatches,
  simulateLeagueStart,
  validateLeagueCreation,
  testScenarios,
  MockPlayer,
  MockLeague,
} from '../utils/league-test-utils';

describe('League Logic Tests', () => {
  describe('Box Configuration Calculation', () => {
    test('should handle small leagues (4-8 players)', () => {
      const config4 = calculateBoxConfiguration(4);
      expect(config4).toEqual({ boxes: 1, playersPerBox: 8, remainder: 4 });

      const config8 = calculateBoxConfiguration(8);
      expect(config8).toEqual({ boxes: 1, playersPerBox: 8, remainder: 0 });
    });

    test('should handle medium leagues (9-16 players)', () => {
      const config12 = calculateBoxConfiguration(12);
      expect(config12).toEqual({ boxes: 2, playersPerBox: 8, remainder: 4 });

      const config16 = calculateBoxConfiguration(16);
      expect(config16).toEqual({ boxes: 2, playersPerBox: 8, remainder: 0 });
    });

    test('should handle large leagues (17-24 players)', () => {
      const config20 = calculateBoxConfiguration(20);
      expect(config20).toEqual({ boxes: 3, playersPerBox: 8, remainder: 4 });

      const config24 = calculateBoxConfiguration(24);
      expect(config24).toEqual({ boxes: 3, playersPerBox: 8, remainder: 0 });
    });

    test('should handle very large leagues (25-32 players)', () => {
      const config28 = calculateBoxConfiguration(28);
      expect(config28).toEqual({ boxes: 4, playersPerBox: 8, remainder: 4 });

      const config32 = calculateBoxConfiguration(32);
      expect(config32).toEqual({ boxes: 4, playersPerBox: 8, remainder: 0 });
    });

    test('should handle edge cases', () => {
      const config1 = calculateBoxConfiguration(1);
      expect(config1).toEqual({ boxes: 1, playersPerBox: 1, remainder: 0 });

      const config3 = calculateBoxConfiguration(3);
      expect(config3).toEqual({ boxes: 1, playersPerBox: 3, remainder: 0 });
    });
  });

  describe('Mock Data Generation', () => {
    test('should generate correct number of mock players', () => {
      const players4 = generateMockPlayers(4);
      expect(players4).toHaveLength(4);
      expect(players4[0]).toHaveProperty('id');
      expect(players4[0]).toHaveProperty('username');
      expect(players4[0]).toHaveProperty('email');
      expect(players4[0]).toHaveProperty('skill_level');
    });

    test('should create valid mock league', () => {
      const league = createMockLeague('Test League', 8, 4);
      expect(league.name).toBe('Test League');
      expect(league.max_players).toBe(8);
      expect(league.current_players).toBe(4);
      expect(league.status).toBe('open');
      expect(league.sport).toBe('squash');
    });

    test('should set league status to full when at capacity', () => {
      const league = createMockLeague('Full League', 8, 8);
      expect(league.status).toBe('full');
    });
  });

  describe('Box Creation', () => {
    test('should create correct number of boxes for 8 players', () => {
      const boxes = createMockBoxes('league-1', 8);
      expect(boxes).toHaveLength(1);
      expect(boxes[0].max_players).toBe(8);
      expect(boxes[0].current_players).toBe(8);
    });

    test('should create correct number of boxes for 16 players', () => {
      const boxes = createMockBoxes('league-1', 16);
      expect(boxes).toHaveLength(2);
      expect(boxes[0].max_players).toBe(8);
      expect(boxes[1].max_players).toBe(8);
    });

    test('should create correct number of boxes for 20 players', () => {
      const boxes = createMockBoxes('league-1', 20);
      expect(boxes).toHaveLength(3);
      // Should distribute players as evenly as possible
      expect(boxes[0].max_players).toBe(8);
      expect(boxes[1].max_players).toBe(8);
      expect(boxes[2].max_players).toBe(4);
    });
  });

  describe('Match Generation', () => {
    test('should generate correct number of round-robin matches for 4 players', () => {
      const players = generateMockPlayers(4);
      const matches = generateRoundRobinMatches('box-1', players);
      // 4 players = 6 matches (4 choose 2)
      expect(matches).toHaveLength(6);
    });

    test('should generate correct number of round-robin matches for 8 players', () => {
      const players = generateMockPlayers(8);
      const matches = generateRoundRobinMatches('box-1', players);
      // 8 players = 28 matches (8 choose 2)
      expect(matches).toHaveLength(28);
    });

    test('should generate matches with correct structure', () => {
      const players = generateMockPlayers(4);
      const matches = generateRoundRobinMatches('box-1', players);
      
      expect(matches[0]).toHaveProperty('id');
      expect(matches[0]).toHaveProperty('box_id', 'box-1');
      expect(matches[0]).toHaveProperty('player1_id');
      expect(matches[0]).toHaveProperty('player2_id');
      expect(matches[0]).toHaveProperty('status', 'scheduled');
    });
  });

  describe('League Start Simulation', () => {
    test('should simulate small league start correctly', () => {
      const league = createMockLeague('Small League', 8, 8);
      const players = generateMockPlayers(8);
      
      const result = simulateLeagueStart(league, players);
      
      expect(result.boxes).toHaveLength(1);
      expect(result.matches).toHaveLength(28); // 8 choose 2
      expect(result.totalMatches).toBe(28);
    });

    test('should simulate large league start correctly', () => {
      const league = createMockLeague('Large League', 20, 20);
      const players = generateMockPlayers(20);
      
      const result = simulateLeagueStart(league, players);
      
      expect(result.boxes.length).toBeGreaterThan(1);
      expect(result.totalMatches).toBeGreaterThan(0);
      
      // Verify all matches have valid structure
      result.matches.forEach(match => {
        expect(match).toHaveProperty('id');
        expect(match).toHaveProperty('box_id');
        expect(match).toHaveProperty('player1_id');
        expect(match).toHaveProperty('player2_id');
      });
    });
  });

  describe('League Validation', () => {
    test('should validate correct league data', () => {
      const validData = {
        name: 'Test League',
        sport: 'squash',
        max_players: 8,
      };
      
      const result = validateLeagueCreation(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject league with missing name', () => {
      const invalidData = {
        sport: 'squash',
        max_players: 8,
      };
      
      const result = validateLeagueCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    test('should reject league with too few players', () => {
      const invalidData = {
        name: 'Test League',
        sport: 'squash',
        max_players: 2,
      };
      
      const result = validateLeagueCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max players must be at least 4');
    });

    test('should reject league with too many players', () => {
      const invalidData = {
        name: 'Test League',
        sport: 'squash',
        max_players: 50,
      };
      
      const result = validateLeagueCreation(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max players must be at most 32');
    });
  });

  describe('Test Scenarios', () => {
    test('should provide small league scenario', () => {
      const scenario = testScenarios.smallLeague();
      expect(scenario.name).toBe('Small Test League');
      expect(scenario.maxPlayers).toBe(4);
      expect(scenario.players).toHaveLength(4);
    });

    test('should provide full league scenario', () => {
      const scenario = testScenarios.fullLeague();
      expect(scenario.name).toBe('Full Test League');
      expect(scenario.maxPlayers).toBe(20);
      expect(scenario.players).toHaveLength(20);
    });

    test('should provide oversized league scenario', () => {
      const scenario = testScenarios.oversizedLeague();
      expect(scenario.name).toBe('Oversized Test League');
      expect(scenario.maxPlayers).toBe(32);
      expect(scenario.players).toHaveLength(32);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete league workflow', () => {
      // Create a league
      const league = createMockLeague('Integration Test League', 12, 12);
      expect(league.status).toBe('full');

      // Generate players
      const players = generateMockPlayers(12);
      expect(players).toHaveLength(12);

      // Start the league
      const result = simulateLeagueStart(league, players);
      
      // Verify results
      expect(result.boxes.length).toBeGreaterThan(0);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.totalMatches).toBeGreaterThan(0);

      // Verify box distribution
      const totalPlayersInBoxes = result.boxes.reduce(
        (sum, box) => sum + box.current_players, 0
      );
      expect(totalPlayersInBoxes).toBe(12);
    });

    test('should handle edge case with odd number of players', () => {
      const league = createMockLeague('Odd Players League', 7, 7);
      const players = generateMockPlayers(7);
      
      const result = simulateLeagueStart(league, players);
      
      expect(result.boxes).toHaveLength(1);
      expect(result.boxes[0].current_players).toBe(7);
      expect(result.matches).toHaveLength(21); // 7 choose 2
    });
  });
});
