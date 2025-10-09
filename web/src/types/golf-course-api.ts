// TypeScript types for Golf Course API
// Based on https://api.golfcourseapi.com/ OpenAPI specification

export interface GolfCourseAPILocation {
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface GolfCourseAPIHole {
  par: 3 | 4 | 5;
  yardage: number;
  handicap?: number; // Sometimes missing from API
}

export interface GolfCourseAPITeeBox {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  bogey_rating: number;
  total_yards: number;
  total_meters: number;
  number_of_holes: number;
  par_total: number;
  front_course_rating: number;
  front_slope_rating: number;
  front_bogey_rating: number;
  back_course_rating: number;
  back_slope_rating: number;
  back_bogey_rating: number;
  holes: GolfCourseAPIHole[];
}

export interface GolfCourseAPITees {
  female?: GolfCourseAPITeeBox[];
  male?: GolfCourseAPITeeBox[];
}

export interface GolfCourseAPICourse {
  id: number;
  club_name: string;
  course_name: string;
  location: GolfCourseAPILocation;
  tees?: GolfCourseAPITees;
}

export interface GolfCourseAPISearchResponse {
  courses: GolfCourseAPICourse[];
}

// Our internal types for cached courses
export interface CachedGolfCourse {
  id: string;
  api_course_id: number;
  club_name: string;
  course_name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  tee_boxes: TeeBoxMetadata[];
  created_at: string;
  updated_at: string;
}

export interface TeeBoxMetadata {
  tee_name: string;
  gender?: 'male' | 'female';
  course_rating: number;
  slope_rating: number;
  total_yards: number;
  total_meters: number;
  par_total: number;
}

export interface CachedGolfCourseHole {
  id: string;
  course_id: string;
  tee_box_name: string;
  hole_number: number;
  par: 3 | 4 | 5;
  yardage: number | null;
  meters: number | null;
  handicap: number | null;
  created_at: string;
}

// For the UI
export interface GolfCourseSearchResult {
  id: number;
  club_name: string;
  course_name: string;
  location: string; // Formatted: "City, State, Country"
  city: string;
  state: string;
  country: string;
}

export interface SelectedGolfCourse {
  api_course_id: number;
  club_name: string;
  course_name: string;
  location: string;
  tee_boxes: TeeBoxOption[];
}

export interface TeeBoxOption {
  name: string;
  display: string; // e.g., "Blue - 6,348 yards (Par 73)"
  par_total: number;
  total_yards: number;
  holes: GolfCourseAPIHole[];
}

export interface GolfHoleFormData {
  hole_number: number;
  par: 3 | 4 | 5;
  handicap: number;
  yardage?: number;
}
