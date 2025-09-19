/**
 * Test utilities for league logic testing
 * These functions simulate league operations without requiring real database connections
 */

export interface MockPlayer {
  id: string;
  username: string;
  email: string;
  skill_level?: number;
}

export interface MockLeague {
  id: string;
  name: string;
  description: string;
  sport: string;
  max_players: number;
  current_players: number;
  status: 'open' | 'full' | 'started' | 'completed';
  created_by: string;
  created_at: string;
}

export interface MockBox {
  id: string;
  league_id: string;
  name: string;
  level: number;
  max_players: number;
  current_players: number;
}

export interface MockMatch {
  id: string;
  league_id: string;
  box_id: string;
  player1_id: string;
  player2_id: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  winner_id?: string;
  score?: string;
}

/**
 * Calculate optimal box configuration based on player count
 */
export function calculateBoxConfiguration(playerCount: number): {
  boxes: number;
  playersPerBox: number;
  remainder: number;
} {
  if (playerCount < 4) {
    return { boxes: 1, playersPerBox: playerCount, remainder: 0 };
  }

  // Optimal box sizes for different player counts
  const configurations = [
    { min: 4, max: 8, boxes: 1, playersPerBox: 8 },
    { min: 9, max: 16, boxes: 2, playersPerBox: 8 },
    { min: 17, max: 24, boxes: 3, playersPerBox: 8 },
    { min: 25, max: 32, boxes: 4, playersPerBox: 8 },
  ];

  const config = configurations.find(
    c => playerCount >= c.min && playerCount <= c.max
  );

  if (config) {
    const remainder = playerCount % config.playersPerBox;
    return {
      boxes: config.boxes,
      playersPerBox: config.playersPerBox,
      remainder,
    };
  }

  // Fallback for larger groups
  const boxes = Math.ceil(playerCount / 8);
  const playersPerBox = Math.floor(playerCount / boxes);
  const remainder = playerCount % boxes;

  return { boxes, playersPerBox, remainder };
}

/**
 * Generate mock players for testing
 */
export function generateMockPlayers(count: number, baseId = 'player'): MockPlayer[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${baseId}-${index + 1}`,
    username: `Player${index + 1}`,
    email: `player${index + 1}@test.com`,
    skill_level: Math.floor(Math.random() * 5) + 1, // 1-5 skill level
  }));
}

/**
 * Create mock league
 */
export function createMockLeague(
  name: string,
  maxPlayers: number = 8,
  currentPlayers: number = 0
): MockLeague {
  return {
    id: `league-${Date.now()}`,
    name,
    description: `Test league: ${name}`,
    sport: 'squash',
    max_players: maxPlayers,
    current_players: currentPlayers,
    status: currentPlayers >= maxPlayers ? 'full' : 'open',
    created_by: 'test-user-1',
    created_at: new Date().toISOString(),
  };
}

/**
 * Create mock boxes for a league
 */
export function createMockBoxes(
  leagueId: string,
  playerCount: number
): MockBox[] {
  const config = calculateBoxConfiguration(playerCount);
  const boxes: MockBox[] = [];

  for (let i = 0; i < config.boxes; i++) {
    const playersInBox = i === config.boxes - 1 && config.remainder > 0
      ? config.remainder
      : config.playersPerBox;

    boxes.push({
      id: `box-${leagueId}-${i + 1}`,
      league_id: leagueId,
      name: `Box ${i + 1}`,
      level: i + 1,
      max_players: playersInBox,
      current_players: playersInBox,
    });
  }

  return boxes;
}

/**
 * Generate round-robin matches for a box
 */
export function generateRoundRobinMatches(
  boxId: string,
  players: MockPlayer[]
): MockMatch[] {
  const matches: MockMatch[] = [];
  const playerIds = players.map(p => p.id);

  // Generate all possible pairings
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      matches.push({
        id: `match-${boxId}-${i}-${j}`,
        league_id: boxId.split('-')[1], // Extract league ID from box ID
        box_id: boxId,
        player1_id: playerIds[i],
        player2_id: playerIds[j],
        status: 'scheduled',
      });
    }
  }

  return matches;
}

/**
 * Simulate league start process
 */
export function simulateLeagueStart(
  league: MockLeague,
  players: MockPlayer[]
): {
  boxes: MockBox[];
  matches: MockMatch[];
  totalMatches: number;
} {
  const boxes = createMockBoxes(league.id, players.length);
  const allMatches: MockMatch[] = [];

  // Distribute players across boxes (simplified - just split evenly)
  const playersPerBox = Math.ceil(players.length / boxes.length);
  
  boxes.forEach((box, boxIndex) => {
    const startIndex = boxIndex * playersPerBox;
    const endIndex = Math.min(startIndex + playersPerBox, players.length);
    const boxPlayers = players.slice(startIndex, endIndex);
    
    const boxMatches = generateRoundRobinMatches(box.id, boxPlayers);
    allMatches.push(...boxMatches);
  });

  return {
    boxes,
    matches: allMatches,
    totalMatches: allMatches.length,
  };
}

/**
 * Test league validation logic
 */
export function validateLeagueCreation(data: {
  name?: string;
  sport?: string;
  max_players?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.sport || data.sport.trim().length === 0) {
    errors.push('Sport is required');
  }

  if (data.max_players !== undefined) {
    if (data.max_players < 4) {
      errors.push('Max players must be at least 4');
    }
    if (data.max_players > 32) {
      errors.push('Max players must be at most 32');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test different league scenarios
 */
export const testScenarios = {
  smallLeague: () => ({
    name: 'Small Test League',
    maxPlayers: 4,
    players: generateMockPlayers(4),
  }),
  
  mediumLeague: () => ({
    name: 'Medium Test League',
    maxPlayers: 8,
    players: generateMockPlayers(8),
  }),
  
  largeLeague: () => ({
    name: 'Large Test League',
    maxPlayers: 16,
    players: generateMockPlayers(16),
  }),
  
  fullLeague: () => ({
    name: 'Full Test League',
    maxPlayers: 20,
    players: generateMockPlayers(20),
  }),
  
  oversizedLeague: () => ({
    name: 'Oversized Test League',
    maxPlayers: 32,
    players: generateMockPlayers(32),
  }),
};
