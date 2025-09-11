export interface PLAYER {
  id: string;
  name: string;
  isRegisteredUser: boolean;
  userId?: string;
}

export interface TEAM {
  score: number;
  players: PLAYER[];
  team_name: string;
}

export interface GAME {
  id: string;
  current_player_index: number;
  current_team: number;
  is_part_of_tournament: boolean;
  status: "pending" | "active" | "completed" | "cancelled";
  tournament_id?: string;
  winner?: number;
  team1: TEAM;
  team2: TEAM;
  cup_formation: string;
  total_cups_per_team: number;
  detailed_tracking: boolean;
  created_at: string;
  updated_at: string;
}

export interface USER {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface USER_STATS {
  id: string;
  user_id: string;
  best_streak: number;
  current_streak: number;
  games_played: number;
  games_won: number;
  perfect_games: number;
  shots_attempted: number;
  shots_made: number;
  total_points: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export enum GAME_STYLE {
  classic = "classic",
  ipa = "ipa",
  lager = "lager",
  stout = "stout",
}

export enum CUP_FORMATION_TYPE {
  sixCups = "6",
  tenCups = "10",
}

export interface GAME_COLORS {
  main: string;
  dark: string;
  light: string;
  accent: string;
  secondary: string;
  cup: string;
}

export interface VENUE {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  email?: string;
  description?: string;
  number_of_tables: number;
  price_per_hour: number;
  hours_of_operation: {
    [day: string]: {
      open: string;
      close: string;
    };
  };
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BOOKING {
  id: string;
  venue_id: string;
  user_id: string;
  table_number: number;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled" | "no_show";
  total_amount: number;
  payment_status: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded";
  payment_intent_id?: string;
  special_requests?: string;
  number_of_players: number;
  created_at: string;
  updated_at: string;
  venue?: VENUE;
}

export interface TIME_SLOT {
  time: string;
  available: boolean;
  availableTables?: number;
  price: number;
}
