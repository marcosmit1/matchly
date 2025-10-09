import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type {
  GolfCourseAPICourse,
  SelectedGolfCourse,
  TeeBoxOption,
  CachedGolfCourse,
  TeeBoxMetadata,
  GolfCourseAPITeeBox,
} from "@/types/golf-course-api";

const GOLF_COURSE_API_URL = "https://api.golfcourseapi.com";
const API_KEY = process.env.GOLF_COURSE_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: "Invalid course ID" },
        { status: 400 }
      );
    }

    console.log(`🏌️ Fetching course details for ID: ${courseId}`);

    const supabase = await createClient();

    // Check if course exists in cache
    const { data: cachedCourse, error: cacheError } = await supabase
      .from("golf_courses")
      .select("*")
      .eq("api_course_id", courseId)
      .single();

    if (cachedCourse && !cacheError) {
      console.log(`✅ Course found in cache`);

      // Get holes for all tee boxes
      const { data: holes, error: holesError } = await supabase
        .from("golf_course_holes")
        .select("*")
        .eq("course_id", cachedCourse.id)
        .order("tee_box_name")
        .order("hole_number");

      if (holesError) {
        console.error("Error fetching cached holes:", holesError);
      }

      // Transform cached data to SelectedGolfCourse format
      const result = transformCachedCourseToSelected(cachedCourse, holes || []);
      return NextResponse.json({ success: true, course: result });
    }

    // Not in cache, fetch from API
    console.log(`📡 Course not in cache, fetching from Golf Course API...`);

    if (!API_KEY) {
      console.error("GOLF_COURSE_API_KEY is not set");
      return NextResponse.json(
        { error: "Golf Course API is not configured" },
        { status: 500 }
      );
    }

    const apiUrl = `${GOLF_COURSE_API_URL}/v1/courses/${courseId}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Key ${API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(`Golf Course API error: ${response.status}`);
      return NextResponse.json(
        { error: "Failed to fetch course details" },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    // The API wraps the course data in a "course" property
    const apiCourse: GolfCourseAPICourse = responseData.course || responseData;
    console.log(`✅ Course fetched from API: ${apiCourse.course_name} (ID: ${apiCourse.id})`);

    // Cache the course in Supabase
    await cacheCourseInSupabase(supabase, apiCourse);

    // Transform and return
    const result = transformAPICourseToSelected(apiCourse);
    return NextResponse.json({ success: true, course: result });

  } catch (error) {
    console.error("Error in /api/golf-courses/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper: Cache course in Supabase
async function cacheCourseInSupabase(supabase: any, apiCourse: GolfCourseAPICourse) {
  try {
    console.log(`💾 Caching course in Supabase...`);

    // Prepare tee boxes metadata
    const teeBoxesMetadata: TeeBoxMetadata[] = [];
    const allTeeBoxes: GolfCourseAPITeeBox[] = [];

    if (apiCourse.tees?.male) {
      apiCourse.tees.male.forEach(tee => {
        teeBoxesMetadata.push({
          tee_name: tee.tee_name,
          gender: "male",
          course_rating: tee.course_rating,
          slope_rating: tee.slope_rating,
          total_yards: tee.total_yards,
          total_meters: tee.total_meters,
          par_total: tee.par_total,
        });
        allTeeBoxes.push(tee);
      });
    }

    if (apiCourse.tees?.female) {
      apiCourse.tees.female.forEach(tee => {
        teeBoxesMetadata.push({
          tee_name: tee.tee_name,
          gender: "female",
          course_rating: tee.course_rating,
          slope_rating: tee.slope_rating,
          total_yards: tee.total_yards,
          total_meters: tee.total_meters,
          par_total: tee.par_total,
        });
        allTeeBoxes.push(tee);
      });
    }

    // Insert course
    const { data: course, error: courseError } = await supabase
      .from("golf_courses")
      .insert({
        api_course_id: apiCourse.id,
        club_name: apiCourse.club_name,
        course_name: apiCourse.course_name,
        city: apiCourse.location?.city || null,
        state: apiCourse.location?.state || null,
        country: apiCourse.location?.country || null,
        latitude: apiCourse.location?.latitude || null,
        longitude: apiCourse.location?.longitude || null,
        tee_boxes: teeBoxesMetadata,
      })
      .select()
      .single();

    if (courseError) {
      console.error("Error caching course:", courseError);
      return;
    }

    console.log(`✅ Course cached with ID: ${course.id}`);

    // Insert holes for each tee box
    const holesToInsert = [];
    for (const teeBox of allTeeBoxes) {
      for (let i = 0; i < teeBox.holes.length; i++) {
        const hole = teeBox.holes[i];
        holesToInsert.push({
          course_id: course.id,
          tee_box_name: teeBox.tee_name,
          hole_number: i + 1,
          par: hole.par,
          yardage: hole.yardage || null,
          meters: null, // API doesn't provide per-hole meters
          handicap: hole.handicap || null, // May be missing
        });
      }
    }

    if (holesToInsert.length > 0) {
      const { error: holesError } = await supabase
        .from("golf_course_holes")
        .insert(holesToInsert);

      if (holesError) {
        console.error("Error caching holes:", holesError);
      } else {
        console.log(`✅ Cached ${holesToInsert.length} holes`);
      }
    }
  } catch (error) {
    console.error("Error in cacheCourseInSupabase:", error);
  }
}

// Helper: Transform API course to SelectedGolfCourse
function transformAPICourseToSelected(apiCourse: GolfCourseAPICourse): SelectedGolfCourse {
  const locationParts = [
    apiCourse.location?.city,
    apiCourse.location?.state,
    apiCourse.location?.country,
  ].filter(Boolean);

  const teeBoxOptions: TeeBoxOption[] = [];

  // Process male tee boxes
  if (apiCourse.tees?.male) {
    apiCourse.tees.male.forEach(tee => {
      teeBoxOptions.push({
        name: tee.tee_name,
        display: `${tee.tee_name} - ${tee.total_yards.toLocaleString()} yards (Par ${tee.par_total})`,
        par_total: tee.par_total,
        total_yards: tee.total_yards,
        holes: tee.holes,
      });
    });
  }

  // Process female tee boxes
  if (apiCourse.tees?.female) {
    apiCourse.tees.female.forEach(tee => {
      teeBoxOptions.push({
        name: tee.tee_name,
        display: `${tee.tee_name} - ${tee.total_yards.toLocaleString()} yards (Par ${tee.par_total})`,
        par_total: tee.par_total,
        total_yards: tee.total_yards,
        holes: tee.holes,
      });
    });
  }

  return {
    api_course_id: apiCourse.id,
    club_name: apiCourse.club_name,
    course_name: apiCourse.course_name,
    location: locationParts.join(", "),
    tee_boxes: teeBoxOptions,
  };
}

// Helper: Transform cached course to SelectedGolfCourse
function transformCachedCourseToSelected(
  cachedCourse: CachedGolfCourse,
  holes: any[]
): SelectedGolfCourse {
  const locationParts = [
    cachedCourse.city,
    cachedCourse.state,
    cachedCourse.country,
  ].filter(Boolean);

  // Group holes by tee box
  const holesByTeeBox = new Map<string, any[]>();
  holes.forEach(hole => {
    if (!holesByTeeBox.has(hole.tee_box_name)) {
      holesByTeeBox.set(hole.tee_box_name, []);
    }
    holesByTeeBox.get(hole.tee_box_name)!.push(hole);
  });

  // Build tee box options
  const teeBoxOptions: TeeBoxOption[] = [];

  cachedCourse.tee_boxes.forEach((metadata: TeeBoxMetadata) => {
    const teeHoles = holesByTeeBox.get(metadata.tee_name) || [];

    teeBoxOptions.push({
      name: metadata.tee_name,
      display: `${metadata.tee_name} - ${metadata.total_yards.toLocaleString()} yards (Par ${metadata.par_total})`,
      par_total: metadata.par_total,
      total_yards: metadata.total_yards,
      holes: teeHoles.map(hole => ({
        par: hole.par,
        yardage: hole.yardage || 0,
        handicap: hole.handicap,
      })),
    });
  });

  return {
    api_course_id: cachedCourse.api_course_id,
    club_name: cachedCourse.club_name,
    course_name: cachedCourse.course_name,
    location: locationParts.join(", "),
    tee_boxes: teeBoxOptions,
  };
}
