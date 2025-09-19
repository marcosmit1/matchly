import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leagueId, cleanupAll = false } = body;

    const results: any = {
      steps: [],
      errors: [],
      success: false,
      deletedCounts: {
        matches: 0,
        boxes: 0,
        participants: 0,
        leagues: 0
      }
    };

    if (cleanupAll) {
      // Clean up all test leagues (those with "Test" in the name)
      results.steps.push('Cleaning up all test leagues...');
      
      // First, get all test leagues
      const { data: testLeagues, error: leaguesError } = await supabase
        .from("leagues")
        .select("id")
        .ilike("name", "%Test%");

      if (leaguesError) {
        results.errors.push(`Failed to fetch test leagues: ${leaguesError.message}`);
        return NextResponse.json(results, { status: 500 });
      }

      if (testLeagues && testLeagues.length > 0) {
        const leagueIds = testLeagues.map(l => l.id);
        
        // Delete matches
        const { error: matchesError } = await supabase
          .from("league_matches")
          .delete()
          .in("league_id", leagueIds);
        
        if (matchesError) {
          results.errors.push(`Failed to delete matches: ${matchesError.message}`);
        } else {
          results.steps.push('✅ Deleted all test matches');
        }

        // Delete boxes
        const { error: boxesError } = await supabase
          .from("league_boxes")
          .delete()
          .in("league_id", leagueIds);
        
        if (boxesError) {
          results.errors.push(`Failed to delete boxes: ${boxesError.message}`);
        } else {
          results.steps.push('✅ Deleted all test boxes');
        }

        // Delete participants
        const { error: participantsError } = await supabase
          .from("league_participants")
          .delete()
          .in("league_id", leagueIds);
        
        if (participantsError) {
          results.errors.push(`Failed to delete participants: ${participantsError.message}`);
        } else {
          results.steps.push('✅ Deleted all test participants');
        }

        // Delete leagues
        const { error: leaguesDeleteError } = await supabase
          .from("leagues")
          .delete()
          .in("id", leagueIds);
        
        if (leaguesDeleteError) {
          results.errors.push(`Failed to delete leagues: ${leaguesDeleteError.message}`);
        } else {
          results.steps.push(`✅ Deleted ${leagueIds.length} test leagues`);
          results.deletedCounts.leagues = leagueIds.length;
        }
      } else {
        results.steps.push('No test leagues found to clean up');
      }

    } else if (leagueId) {
      // Clean up specific league
      results.steps.push(`Cleaning up league ${leagueId}...`);
      
      // Delete matches
      const { error: matchesError } = await supabase
        .from("league_matches")
        .delete()
        .eq("league_id", leagueId);
      
      if (matchesError) {
        results.errors.push(`Failed to delete matches: ${matchesError.message}`);
      } else {
        results.steps.push('✅ Deleted matches');
      }

      // Delete boxes
      const { error: boxesError } = await supabase
        .from("league_boxes")
        .delete()
        .eq("league_id", leagueId);
      
      if (boxesError) {
        results.errors.push(`Failed to delete boxes: ${boxesError.message}`);
      } else {
        results.steps.push('✅ Deleted boxes');
      }

      // Delete participants
      const { error: participantsError } = await supabase
        .from("league_participants")
        .delete()
        .eq("league_id", leagueId);
      
      if (participantsError) {
        results.errors.push(`Failed to delete participants: ${participantsError.message}`);
      } else {
        results.steps.push('✅ Deleted participants');
      }

      // Delete league
      const { error: leagueError } = await supabase
        .from("leagues")
        .delete()
        .eq("id", leagueId);
      
      if (leagueError) {
        results.errors.push(`Failed to delete league: ${leagueError.message}`);
      } else {
        results.steps.push('✅ Deleted league');
        results.deletedCounts.leagues = 1;
      }

    } else {
      results.errors.push('Either leagueId or cleanupAll must be specified');
      return NextResponse.json(results, { status: 400 });
    }

    results.success = results.errors.length === 0;
    
    if (results.success) {
      results.steps.push('🎉 Cleanup completed successfully!');
    } else {
      results.steps.push('❌ Cleanup completed with errors');
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
