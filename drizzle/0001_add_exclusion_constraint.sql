-- Enable btree_gist extension to support GIST index on basic types (uuid, timestamp)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping bookings on the same court
-- We use tsrange(start_time, end_time) to create a time range and && to check for overlaps
-- court_id must be equal (=) and ranges must overlap (&&)
ALTER TABLE booking 
ADD CONSTRAINT no_overlap_bookings 
EXCLUDE USING gist (
  court_id WITH =,
  tsrange(start_time, end_time) WITH &&
);
