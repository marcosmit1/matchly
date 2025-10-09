import { createClient } from "@/supabase/server";
import { notFound, redirect } from "next/navigation";
import { GolfScorecardGrid } from "./golf-scorecard-grid";

interface GolfPlayPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function GolfPlayPage({ params }: GolfPlayPageProps) {
  const supabase = await createClient();
  const { tournamentId } = await params;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?returnUrl=${encodeURIComponent(`/golf/${tournamentId}/play`)}`);
  }

  // Fetch golf tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from("golf_tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Check if tournament has started
  if (tournament.status !== 'active') {
    redirect(`/golf/${tournamentId}`);
  }

  // Fetch participant info for current user
  const { data: currentParticipant, error: participantError } = await supabase
    .from("golf_tournament_participants")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("user_id", user.id)
    .single();

  if (participantError || !currentParticipant) {
    redirect(`/golf/${tournamentId}`);
  }

  // Check if user is tournament creator
  const isCreator = tournament.created_by === user.id;

  // Fetch participants - if creator, show all; otherwise show just your fourball
  let participants = [currentParticipant];

  if (isCreator) {
    // Tournament creator can see and manage all participants
    const { data: allParticipants, error: participantsError } = await supabase
      .from("golf_tournament_participants")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("joined_at", { ascending: true });

    if (participantsError) {
      console.error('Error fetching all participants:', participantsError);
      console.error('Error details:', JSON.stringify(participantsError));
    } else if (allParticipants) {
      participants = allParticipants;
    }
  } else if (currentParticipant.fourball_number) {
    // Regular players only see their fourball
    const { data: fourballParticipants, error: participantsError } = await supabase
      .from("golf_tournament_participants")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("fourball_number", currentParticipant.fourball_number)
      .order("position_in_fourball", { ascending: true });

    if (participantsError) {
      console.error('Error fetching fourball participants:', participantsError);
    } else if (fourballParticipants) {
      participants = fourballParticipants;
    }
  }

  // Fetch holes
  console.log("🎯 Fetching holes for tournament:", tournamentId);
  const { data: initialHoles, error: holesError } = await supabase
    .from("golf_holes")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("hole_number", { ascending: true });
  
  let holes = initialHoles;

  console.log("🏌️ Holes data:", holes);
  console.log("❌ Holes error (if any):", holesError);

  // If no holes exist or there's an error, create default ones
  if (!holes || holes.length === 0 || holesError) {
    console.log("🆕 Creating default holes...");
    
    // First, try to create holes using the RPC
    const { error: createHolesError } = await supabase.rpc('create_default_golf_holes', {
      tournament_id: tournamentId
    });

    if (createHolesError) {
      console.error("Error using RPC to create holes:", createHolesError);
      
      // If RPC fails, try direct insert
      console.log("↪️ Falling back to direct insert...");
      const { error: insertError } = await supabase
        .from("golf_holes")
        .insert(
          Array.from({ length: 18 }, (_, i) => ({
            tournament_id: tournamentId,
            hole_number: i + 1,
            par: 4
          }))
        );

      if (insertError) {
        console.error("Error inserting holes:", insertError);
        notFound();
      }
    }

    // Fetch the newly created holes
    const { data: newHoles, error: newHolesError } = await supabase
      .from("golf_holes")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("hole_number", { ascending: true });

    console.log("✨ Newly created holes:", newHoles);
    
    if (newHolesError || !newHoles || newHoles.length === 0) {
      console.error("Error fetching new holes:", newHolesError);
      notFound();
    }

    holes = newHoles;
  }

  // Enrich holes with cached course par/handicap if needed
  if (!holes || holes.length === 0 || holes.some(h => !h.handicap || !h.par)) {
    try {
      console.log('🔎 [Play] Enrichment needed. Looking up cached course for', tournament.course_name, 'or', tournament.name);
      let course: { id: string } | null = null;
      if (tournament.cached_course_id) {
        course = { id: tournament.cached_course_id };
      }
      if (!course) {
        const res2 = await supabase
          .from('golf_courses')
          .select('id')
          .ilike('name', tournament.name)
          .maybeSingle();
        course = res2.data as typeof course;
      }
      console.log('🧭 [Play] Cached course:', course);
      if (course?.id) {
        const { data: courseHoles } = await supabase
          .from('golf_course_holes')
          .select('hole_number, par, handicap')
          .eq('course_id', course.id);
        console.log('🗂️ [Play] Cached course holes:', courseHoles);
        if (courseHoles && courseHoles.length > 0) {
          const bestByHole = new Map<number, { par: number | null; handicap: number | null }>();
          for (const ch of courseHoles) {
            const existing = bestByHole.get(ch.hole_number);
            const take = !existing || existing.handicap == null || existing.par == null;
            if (take) bestByHole.set(ch.hole_number, { par: ch.par ?? null, handicap: ch.handicap ?? null });
          }
          // Overlay authoritative par/handicap from course cache
          holes = (holes || []).map(h => {
            const best = bestByHole.get(h.hole_number);
            if (!best) return h;
            return { ...h, par: best.par ?? h.par, handicap: best.handicap ?? h.handicap };
          });
          console.log('✅ [Play] Enriched holes:', holes);
        }
      }
    } catch (e) {
      console.warn('Hole enrichment skipped:', e);
    }
  }

  // Fetch existing scores for all participants in the fourball
  const participantIds = participants.map(p => p.id);
  const { data: existingScores, error: scoresError } = await supabase
    .from("golf_scores")
    .select("*")
    .eq("tournament_id", tournamentId)
    .in("participant_id", participantIds);

  return (
    <GolfScorecardGrid
      tournament={tournament}
      participants={participants}
      holes={holes}
      existingScores={existingScores || []}
      currentUserId={user.id}
    />
  );
}
