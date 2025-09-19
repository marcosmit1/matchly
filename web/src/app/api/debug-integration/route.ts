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

    const results: any = {
      steps: [],
      errors: [],
      success: false
    };

    // Test 1: Check if we can connect to Supabase
    results.steps.push('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('leagues')
      .select('count')
      .limit(1);

    if (testError) {
      results.errors.push(`Supabase connection failed: ${testError.message}`);
    } else {
      results.steps.push('✅ Supabase connection successful');
    }

    // Test 2: Check if create_league RPC exists
    results.steps.push('Testing create_league RPC...');
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_league", {
        p_name: "Debug Test League",
        p_description: "Debug test",
        p_sport: "squash",
        p_max_players: 8,
        p_start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        p_location: "Test Location",
        p_entry_fee: 0,
        p_prize_pool: 0,
      });

      if (rpcError) {
        results.errors.push(`create_league RPC failed: ${rpcError.message}`);
      } else {
        results.steps.push('✅ create_league RPC successful');
        results.steps.push(`RPC returned: ${JSON.stringify(rpcData)}`);
        
        // Clean up the test league
        if (rpcData && rpcData.id) {
          await supabase.from('leagues').delete().eq('id', rpcData.id);
          results.steps.push('✅ Test league cleaned up');
        }
      }
    } catch (rpcException) {
      results.errors.push(`create_league RPC exception: ${rpcException}`);
    }

    // Test 3: Check database schema
    results.steps.push('Checking database schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['leagues', 'league_participants', 'league_boxes', 'league_matches']);

    if (schemaError) {
      results.errors.push(`Schema check failed: ${schemaError.message}`);
    } else {
      results.steps.push('✅ Database schema check successful');
      results.steps.push(`Found tables: ${schemaData?.map(t => t.table_name).join(', ')}`);
    }

    results.success = results.errors.length === 0;
    return NextResponse.json(results);

  } catch (error) {
    console.error('Debug test error:', error);
    return NextResponse.json(
      { 
        error: 'Debug test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
