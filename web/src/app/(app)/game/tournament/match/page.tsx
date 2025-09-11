import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/supabase/server";
import { PLAYER, USER, CUP_FORMATION_TYPE } from "@/types/game";
import { CREATE_GAME } from "../../actions";

function toPlayer(name: string): PLAYER {
  return { id: crypto.randomUUID(), name, isRegisteredUser: false };
}

export default async function TournamentMatchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tid = typeof sp.tid === "string" ? sp.tid : undefined;
  const aid = typeof sp.aid === "string" ? sp.aid : undefined;
  const bid = typeof sp.bid === "string" ? sp.bid : undefined;
  const mid = typeof sp.mid === "string" ? sp.mid : undefined; // optional match id

  if (!tid || !aid || !bid) redirect("/game/tournament");

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: userdata } = await supabase.from("users").select("*").eq("id", authUser.id).single();
  const user = userdata as unknown as USER;

  // Fetch actual players from tournament_team_players
  const { data: teamARec } = await supabase
    .from("tournament_teams")
    .select("id, name, tournament_team_players(player_name, player_user_id)")
    .eq("id", aid)
    .single();

  const { data: teamBRec } = await supabase
    .from("tournament_teams")
    .select("id, name, tournament_team_players(player_name, player_user_id)")
    .eq("id", bid)
    .single();

  if (!teamARec || !teamBRec) redirect(`/game/tournament/view?id=${tid}`);

  const team1players: PLAYER[] = (teamARec.tournament_team_players || []).map((p: any) =>
    p.player_user_id ? { id: p.player_user_id, name: p.player_name, isRegisteredUser: true, userId: p.player_user_id } : toPlayer(p.player_name)
  );
  const team2players: PLAYER[] = (teamBRec.tournament_team_players || []).map((p: any) =>
    p.player_user_id ? { id: p.player_user_id, name: p.player_name, isRegisteredUser: true, userId: p.player_user_id } : toPlayer(p.player_name)
  );

  // Auto-create a game and redirect to it
  // Use the same cup formation as Quick Match (six cups)
  const { gameid } = await CREATE_GAME(
    team1players,
    team2players,
    CUP_FORMATION_TYPE.sixCups,
    { isTournament: true, tournamentId: tid, team1Name: teamARec.name, team2Name: teamBRec.name }
  );

  // Link created game to the tournament match and set status
  try {
    const supabaseMut = await createServerClient();
    if (mid) {
      await supabaseMut
        .from("tournament_matches")
        .update({ game_id: gameid, status: "in_progress" })
        .eq("id", mid);
    } else {
      await supabaseMut
        .from("tournament_matches")
        .update({ game_id: gameid, status: "in_progress" })
        .eq("tournament_id", tid)
        .eq("team_a_id", teamARec.id)
        .eq("team_b_id", teamBRec.id)
        .limit(1);
    }
  } catch (e) {
    console.error("Failed to link game to tournament match", e);
  }
  redirect(`/game/${gameid}`);
}


