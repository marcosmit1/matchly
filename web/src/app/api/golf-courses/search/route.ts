import { NextRequest, NextResponse } from "next/server";
import type { GolfCourseAPISearchResponse, GolfCourseSearchResult } from "@/types/golf-course-api";

const GOLF_COURSE_API_URL = "https://api.golfcourseapi.com";
const API_KEY = process.env.GOLF_COURSE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      console.error("GOLF_COURSE_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Golf Course API is not configured" },
        { status: 500 }
      );
    }

    // Call Golf Course API
    const apiUrl = `${GOLF_COURSE_API_URL}/v1/search?search_query=${encodeURIComponent(query)}`;
    console.log(`🏌️ Searching Golf Course API for: "${query}"`);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Key ${API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(`Golf Course API error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Golf Course API authentication failed" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Failed to search golf courses" },
        { status: response.status }
      );
    }

    const data: GolfCourseAPISearchResponse = await response.json();
    console.log(`✅ Found ${data.courses?.length || 0} courses`);

    // Transform to our search result format
    const results: GolfCourseSearchResult[] = (data.courses || []).map(course => {
      const locationParts = [
        course.location?.city,
        course.location?.state,
        course.location?.country
      ].filter(Boolean);

      return {
        id: course.id,
        club_name: course.club_name,
        course_name: course.course_name,
        location: locationParts.join(", "),
        city: course.location?.city || "",
        state: course.location?.state || "",
        country: course.location?.country || "",
      };
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error in /api/golf-courses/search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
