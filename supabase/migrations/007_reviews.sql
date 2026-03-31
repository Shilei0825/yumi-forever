-- =====================================================
-- 007: Enhanced Reviews System
-- Adds customer_name, customer_email, service_name,
-- is_approved, is_featured columns. Makes profile_id
-- nullable for guest reviews. Adds new RLS policies.
-- =====================================================

-- Drop existing RLS policies on reviews so we can recreate them
DROP POLICY IF EXISTS "Anyone can view published reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Admin can manage reviews" ON reviews;

-- Drop the NOT NULL constraint on profile_id (allow guest reviews)
ALTER TABLE reviews ALTER COLUMN profile_id DROP NOT NULL;

-- Drop the NOT NULL + UNIQUE constraint on booking_id (allow standalone reviews)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_key;
ALTER TABLE reviews ALTER COLUMN booking_id DROP NOT NULL;

-- Add new columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_email TEXT NOT NULL DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS service_name TEXT NOT NULL DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured);

-- =====================================================
-- NEW RLS POLICIES
-- =====================================================

-- Anyone can insert a review (for guest review submissions)
CREATE POLICY "Anyone can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- Anyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

-- Admins can read all reviews
CREATE POLICY "Admin can view all reviews"
  ON reviews FOR SELECT
  USING (get_user_role() = 'admin');

-- Admins can update any review (approve, feature, etc.)
CREATE POLICY "Admin can update all reviews"
  ON reviews FOR UPDATE
  USING (get_user_role() = 'admin');

-- Admins can delete reviews
CREATE POLICY "Admin can delete reviews"
  ON reviews FOR DELETE
  USING (get_user_role() = 'admin');
