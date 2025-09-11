import { createClient } from "@/supabase/server";
import SplashScreen from "@/components/splash-screen";
import { PlaytomicHome } from "./playtomic-home";
import { formatUserDisplayName } from "@/lib/player-utils";


type PlayerStatsRow = {
  player_id: string;
  matches_played: number;
  matches_won: number;
  win_rate: number | null;
  games_won: number;
  games_lost: number;
  points_won: number;
  points_lost: number;
  skill_level: number;
  last_match_at: string | null;
};

async function fetchPlayerStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch user profile data (username, first_name, last_name)
  const { data: profile } = await supabase
    .from("users")
    .select("username, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: stats } = await supabase
    .from("tournament_players")
    .select(
      [
        "matches_played",
        "matches_won",
        "games_won",
        "games_lost",
        "points_won",
        "points_lost",
        "player_id",
      ].join(",")
    )
    .eq("player_user_id", user.id)
    .maybeSingle();

  const row = (stats as unknown as PlayerStatsRow | null) || null;
  const matchesPlayed = Number(row?.matches_played ?? 0);
  const matchesWon = Number(row?.matches_won ?? 0);
  const winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
  
  // Calculate skill level based on performance (simplified)
  const skillLevel = winRate > 80 ? 3.4 : winRate > 60 ? 2.5 : winRate > 40 ? 1.8 : 1.1;

  return { 
    user, 
    profile: profile || { username: null, first_name: null, last_name: null },
    stats: row ? { ...row, win_rate: winRate, skill_level: skillLevel } : null 
  };
}

export default async function Page() {
  const data = await fetchPlayerStats();

  // Get display name using username first, then first_name/last_name, then formatted email
  const username = formatUserDisplayName({
    ...data?.user,
    username: data?.profile?.username,
    first_name: data?.profile?.first_name,
    last_name: data?.profile?.last_name,
  } as any);

  // Get current time and location for greeting
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });

  return (
    <>
      <SplashScreen />
      <PlaytomicHome 
        username={username}
        userStats={data?.stats}
        timeString={timeString}
        dateString={dateString}
      />
    </>
  );
}