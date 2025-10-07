// Golf Tournament TypeScript Types

export type GolfTournamentFormat = 'stroke_play' | 'best_ball' | 'scramble';
export type GolfTournamentStatus = 'setup' | 'active' | 'completed' | 'cancelled';
export type GolfParticipantStatus = 'active' | 'withdrawn' | 'disqualified';
export type GolfPenaltyType = 'water' | 'ob' | 'bunker' | '3_putt' | 'lost_ball' | 'other';
export type GolfFineStatus = 'pending' | 'accepted' | 'rejected';
export type GolfChallengeType = 'closest_to_pin' | 'longest_drive';
export type GolfActivityType = 'score' | 'penalty' | 'fine' | 'achievement' | 'challenge_win' | 'comment';

export interface GolfTournament {
  id: string;
  name: string;
  description?: string;
  course_name: string;
  course_par: number;
  holes_count: 9 | 18;
  format: GolfTournamentFormat;
  status: GolfTournamentStatus;
  created_by: string;
  start_date?: string;
  location?: string;
  max_players: number;
  current_players: number;
  invite_code: string;
  handicap_enabled: boolean;
  side_bets_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GolfTournamentParticipant {
  id: string;
  tournament_id: string;
  user_id?: string;
  player_name: string;
  handicap: number;
  fourball_number?: number;
  position_in_fourball?: number;
  status: GolfParticipantStatus;
  joined_at: string;
}

export interface GolfHole {
  id: string;
  tournament_id: string;
  hole_number: number;
  par: 3 | 4 | 5;
  has_closest_to_pin: boolean;
  has_longest_drive: boolean;
  description?: string;
}

export interface GolfScore {
  id: string;
  tournament_id: string;
  participant_id: string;
  hole_number: number;
  strokes: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  is_eagle: boolean;
  is_birdie: boolean;
  is_par: boolean;
  is_bogey: boolean;
  is_double_bogey_plus: boolean;
  created_at: string;
  updated_at: string;
}

export interface GolfPenalty {
  id: string;
  tournament_id: string;
  participant_id: string;
  hole_number: number;
  penalty_type: GolfPenaltyType;
  strokes_added: number;
  reported_by_user_id?: string;
  note?: string;
  created_at: string;
}

export interface GolfFine {
  id: string;
  tournament_id: string;
  from_user_id: string;
  to_participant_id: string;
  amount: number;
  reason: string;
  hole_number?: number;
  status: GolfFineStatus;
  created_at: string;
  responded_at?: string;
}

export interface GolfHoleChallenge {
  id: string;
  tournament_id: string;
  hole_number: number;
  challenge_type: GolfChallengeType;
  winner_participant_id?: string;
  measurement?: number;
  measurement_unit: string;
  created_at: string;
  updated_at: string;
}

export interface GolfActivityFeed {
  id: string;
  tournament_id: string;
  participant_id?: string;
  activity_type: GolfActivityType;
  hole_number?: number;
  message: string;
  metadata?: any;
  created_at: string;
}

// Extended types with relationships
export interface GolfParticipantWithUser extends GolfTournamentParticipant {
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

export interface GolfScoreWithDetails extends GolfScore {
  participant?: GolfParticipantWithUser;
  hole?: GolfHole;
}

export interface GolfPenaltyWithDetails extends GolfPenalty {
  participant?: GolfParticipantWithUser;
  reported_by?: {
    id: string;
    name?: string;
  };
}

export interface GolfFineWithDetails extends GolfFine {
  from_user?: {
    id: string;
    name?: string;
  };
  to_participant?: GolfParticipantWithUser;
}

// Leaderboard types
export interface GolfLeaderboardEntry {
  participant_id: string;
  player_name: string;
  fourball_number?: number;
  total_strokes: number;
  total_vs_par: number;
  holes_completed: number;
  birdies: number;
  eagles: number;
  pars: number;
  bogeys: number;
  penalties: number;
  current_position: number;
  user_id?: string;
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

export interface GolfFourballLeaderboard {
  fourball_number: number;
  fourball_name: string;
  total_best_ball_score: number;
  total_vs_par: number;
  holes_completed: number;
  participants: GolfParticipantWithUser[];
}

export interface GolfWallOfShame {
  worst_score: {
    participant: GolfParticipantWithUser;
    score: number;
    hole_number: number;
  } | null;
  most_penalties: {
    participant: GolfParticipantWithUser;
    count: number;
  } | null;
  most_water: {
    participant: GolfParticipantWithUser;
    count: number;
  } | null;
  most_3_putts: {
    participant: GolfParticipantWithUser;
    count: number;
  } | null;
}

export interface GolfHeroBoard {
  most_birdies: {
    participant: GolfParticipantWithUser;
    count: number;
  } | null;
  most_eagles: {
    participant: GolfParticipantWithUser;
    count: number;
  } | null;
  longest_drive_winners: GolfHoleChallenge[];
  closest_to_pin_winners: GolfHoleChallenge[];
}

// Statistics types
export interface GolfParticipantStats {
  participant_id: string;
  player_name: string;
  total_strokes: number;
  total_vs_par: number;
  holes_completed: number;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  double_bogeys_plus: number;
  fairways_hit: number;
  fairways_attempted: number;
  gir: number; // greens in regulation
  gir_attempted: number;
  total_putts: number;
  avg_putts_per_hole: number;
  penalties: {
    water: number;
    ob: number;
    bunker: number;
    three_putt: number;
    lost_ball: number;
    other: number;
    total: number;
  };
  best_hole: {
    hole_number: number;
    score: number;
    vs_par: number;
  } | null;
  worst_hole: {
    hole_number: number;
    score: number;
    vs_par: number;
  } | null;
}

// API request/response types
export interface CreateGolfTournamentRequest {
  name: string;
  description?: string;
  course_name: string;
  course_par?: number;
  holes_count?: 9 | 18;
  format?: GolfTournamentFormat;
  start_date?: string;
  location?: string;
  max_players?: number;
  handicap_enabled?: boolean;
  side_bets_enabled?: boolean;
  holes?: Array<{
    hole_number: number;
    par: 3 | 4 | 5;
    has_closest_to_pin?: boolean;
    has_longest_drive?: boolean;
    description?: string;
  }>;
}

export interface JoinGolfTournamentRequest {
  invite_code: string;
  player_name?: string;
  handicap?: number;
}

export interface SubmitGolfScoreRequest {
  participant_id: string;
  hole_number: number;
  strokes: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  bunker?: boolean;
  penalties?: Array<{
    penalty_type: GolfPenaltyType;
    note?: string;
  }>;
}

export interface SendGolfFineRequest {
  to_participant_id: string;
  amount: number;
  reason: string;
  hole_number?: number;
}

export interface AssignFourballsRequest {
  auto_assign?: boolean;
  manual_assignments?: Array<{
    participant_id: string;
    fourball_number: number;
    position_in_fourball: number;
  }>;
}

// Scoring helpers
export const getScoreLabel = (vspar: number): string => {
  if (vspar <= -2) return 'Eagle';
  if (vspar === -1) return 'Birdie';
  if (vspar === 0) return 'Par';
  if (vspar === 1) return 'Bogey';
  if (vspar === 2) return 'Double Bogey';
  return `+${vspar}`;
};

export const getScoreColor = (vsPar: number): string => {
  if (vsPar <= -2) return 'text-yellow-500'; // Eagle - gold
  if (vsPar === -1) return 'text-green-500'; // Birdie - green
  if (vsPar === 0) return 'text-white'; // Par - white
  if (vsPar === 1) return 'text-orange-400'; // Bogey - orange
  return 'text-red-500'; // Double bogey+ - red
};

export const getPenaltyEmoji = (type: GolfPenaltyType): string => {
  switch (type) {
    case 'water': return '💦';
    case 'ob': return '🌲';
    case 'bunker': return '🏖️';
    case '3_putt': return '⛳';
    case 'lost_ball': return '🔍';
    default: return '⚠️';
  }
};

export const getPenaltyLabel = (type: GolfPenaltyType): string => {
  switch (type) {
    case 'water': return 'Water Hazard';
    case 'ob': return 'Out of Bounds';
    case 'bunker': return 'Bunker';
    case '3_putt': return '3-Putt';
    case 'lost_ball': return 'Lost Ball';
    default: return 'Other Penalty';
  }
};
