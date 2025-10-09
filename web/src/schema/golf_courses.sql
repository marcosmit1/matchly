-- Golf Courses Cache Tables
-- Stores golf course data from Golf Course API to reduce API calls and improve performance

-- Main golf courses table
CREATE TABLE IF NOT EXISTS golf_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_course_id INTEGER UNIQUE NOT NULL,  -- ID from Golf Course API
  club_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  tee_boxes JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of tee box data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf course holes for each tee box
CREATE TABLE IF NOT EXISTS golf_course_holes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
  tee_box_name TEXT NOT NULL,  -- "Blue", "White", "Red", etc.
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 5),
  yardage INTEGER,
  meters INTEGER,
  handicap INTEGER CHECK (handicap BETWEEN 1 AND 18),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, tee_box_name, hole_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_golf_courses_api_id ON golf_courses(api_course_id);
CREATE INDEX IF NOT EXISTS idx_golf_courses_search ON golf_courses USING GIN (
  to_tsvector('english', club_name || ' ' || course_name || ' ' || COALESCE(city, '') || ' ' || COALESCE(state, ''))
);
CREATE INDEX IF NOT EXISTS idx_golf_course_holes_course_id ON golf_course_holes(course_id);
CREATE INDEX IF NOT EXISTS idx_golf_course_holes_lookup ON golf_course_holes(course_id, tee_box_name);

-- Row Level Security Policies
ALTER TABLE golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_course_holes ENABLE ROW LEVEL SECURITY;

-- Everyone can read golf courses (public data)
CREATE POLICY "Anyone can view golf courses" ON golf_courses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view golf course holes" ON golf_course_holes
  FOR SELECT USING (true);

-- Only authenticated users can insert (via API)
CREATE POLICY "Authenticated users can insert golf courses" ON golf_courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert golf course holes" ON golf_course_holes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update golf courses" ON golf_courses
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update golf course holes" ON golf_course_holes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_golf_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER golf_courses_updated_at
  BEFORE UPDATE ON golf_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_golf_courses_updated_at();

-- Comment on tables
COMMENT ON TABLE golf_courses IS 'Cached golf course data from Golf Course API';
COMMENT ON TABLE golf_course_holes IS 'Hole details for each tee box at a golf course';
COMMENT ON COLUMN golf_courses.api_course_id IS 'Unique ID from Golf Course API';
COMMENT ON COLUMN golf_courses.tee_boxes IS 'JSON array of all tee box metadata (course_rating, slope_rating, total_yards, etc.)';
COMMENT ON COLUMN golf_course_holes.handicap IS 'Stroke index for the hole (1-18, where 1 is hardest)';
