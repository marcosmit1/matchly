import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);


async function simulateGolfTournament() {
  try {
    console.log('🏌️ Starting golf tournament simulation...');


    // Create test players
    const players = [
      { name: 'Tiger Woods', skill: 'pro' },
      { name: 'Bob from Accounting', skill: 'beginner' },
      { name: 'Weekend Warrior', skill: 'average' },
      { name: 'Mulligan Master', skill: 'beginner' }
    ];

    // Create tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('golf_tournaments')
      .insert({
        name: 'Test Tournament ' + new Date().toLocaleString(),
        course_name: 'Test Golf Club',
        status: 'active',
        max_players: players.length,
        current_players: players.length,
        holes_count: 18,
        course_par: 72,
        format: 'stroke_play',
        created_by: '675d39a2-d1fa-4d4a-8a94-47c28e92b2ff' // Marcos's user ID
      })
      .select()
      .single();

    if (tournamentError) throw tournamentError;
    console.log('✅ Tournament created:', tournament.id);

    // Check if holes already exist, if not create them
    console.log('🏌️ Checking for existing holes...');
    const { data: existingHoles, error: holesCheckError } = await supabase
      .from('golf_holes')
      .select('*')
      .eq('tournament_id', tournament.id)
      .order('hole_number');

    let holes = existingHoles || [];

    if (!holes || holes.length === 0) {
      console.log('🏌️ Creating 18 holes...');
      const holesToCreate = Array(18).fill(null).map((_, i) => ({
        tournament_id: tournament.id,
        hole_number: i + 1,
        par: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3,
        handicap: i + 1
      }));

      const { error: holesError } = await supabase
        .from('golf_holes')
        .insert(holesToCreate);

      if (holesError) throw holesError;
      console.log('✅ Holes created');
      
      // Fetch the created holes
      const { data: createdHoles } = await supabase
        .from('golf_holes')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('hole_number');
      
      holes = createdHoles || [];
    } else {
      console.log(`✅ Found ${holes.length} existing holes`);
    }

    // Create participants
    const participantPromises = players.map(player =>
      supabase
        .from('golf_tournament_participants')
        .insert({
          tournament_id: tournament.id,
          player_name: player.name,
          is_guest: true,
          fourball_number: 1
        })
        .select()
        .single()
    );

    const participants = await Promise.all(participantPromises);
    console.log('✅ Participants created');

    // Simulate scores for each hole
    for (const { data: participant } of participants) {
      console.log(`🎯 Generating scores for ${participant.player_name}...`);
      
      const player = players.find(p => p.name === participant.player_name)!;
      
      for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
        const hole = holes.find(h => h.hole_number === holeNumber)!;
        
        // Generate realistic scores based on skill level
        const skillFactors = {
          pro: { baseStroke: 0, variance: 1, fairwayChance: 0.8, bunkerChance: 0.1, waterChance: 0.05 },
          average: { baseStroke: 1, variance: 2, fairwayChance: 0.5, bunkerChance: 0.2, waterChance: 0.15 },
          beginner: { baseStroke: 2, variance: 3, fairwayChance: 0.3, bunkerChance: 0.3, waterChance: 0.25 }
        };

        const factor = skillFactors[player.skill as keyof typeof skillFactors];
        
        // Calculate strokes
        const baseStrokes = hole.par + factor.baseStroke;
        const variance = Math.floor(Math.random() * (factor.variance * 2 + 1)) - factor.variance;
        const strokes = Math.max(1, baseStrokes + variance);

        // Generate other stats
        const fairwayHit = Math.random() < factor.fairwayChance;
        const bunker = Math.random() < factor.bunkerChance;
        const waterHazard = Math.random() < factor.waterChance;
        const putts = Math.min(strokes - 1, 1 + Math.floor(Math.random() * 3)); // 1-3 putts, but not more than strokes-1
        
        // Calculate score types
        const vsPar = strokes - hole.par;
        const scoreTypes = {
          is_eagle: vsPar <= -2,
          is_birdie: vsPar === -1,
          is_par: vsPar === 0,
          is_bogey: vsPar === 1,
          is_double_bogey_plus: vsPar >= 2
        };

        // Save score
        await supabase
          .from('golf_scores')
          .insert({
            tournament_id: tournament.id,
            participant_id: participant.id,
            hole_number: holeNumber,
            strokes,
            putts,
            fairway_hit: fairwayHit,
            green_in_regulation: strokes <= hole.par + 1,
            bunker,
            water_hazard: waterHazard,
            ...scoreTypes
          });
      }
    }

    console.log('✅ All scores generated');

    // Complete the tournament
    const { error: completeError } = await supabase
      .from('golf_tournaments')
      .update({ status: 'completed' })
      .eq('id', tournament.id);

    if (completeError) throw completeError;
    console.log('✅ Tournament completed');
    console.log('🎉 Tournament simulation finished! Tournament ID:', tournament.id);
    console.log('View it at: /golf/' + tournament.id);

  } catch (error) {
    console.error('❌ Error in simulation:', error);
  }
}

// Run the simulation
simulateGolfTournament();