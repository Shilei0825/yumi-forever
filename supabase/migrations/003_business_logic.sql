-- =====================================================
-- Migration 003: Business Logic — Job Flow, Payroll,
-- On-Site Adjustments
-- =====================================================

-- =====================================================
-- 1. ALTER BOOKINGS — Job Flow Fields
-- =====================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS estimated_price INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_price INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_adjusted BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS auto_service_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS home_service_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_class TEXT;

-- =====================================================
-- 2. ALTER BOOKING AUTO DETAILS — new condition fields
-- =====================================================

ALTER TABLE booking_auto_details ADD COLUMN IF NOT EXISTS sand_mud BOOLEAN DEFAULT FALSE;
ALTER TABLE booking_auto_details ADD COLUMN IF NOT EXISTS vehicle_color TEXT;
ALTER TABLE booking_auto_details ADD COLUMN IF NOT EXISTS condition_level TEXT CHECK (condition_level IN ('light', 'daily', 'extra_care', 'heavy'));
ALTER TABLE booking_auto_details ADD COLUMN IF NOT EXISTS auto_service_type TEXT CHECK (auto_service_type IN ('exterior', 'interior', 'full', 'premium'));

-- Update vehicle_class constraint to match new values
ALTER TABLE booking_auto_details DROP CONSTRAINT IF EXISTS booking_auto_details_vehicle_class_check;
ALTER TABLE booking_auto_details ADD CONSTRAINT booking_auto_details_vehicle_class_check
  CHECK (vehicle_class IN ('sedan', 'small_suv', 'large_suv', 'truck_van'));

-- =====================================================
-- 3. ALTER BOOKING HOME DETAILS — service type
-- =====================================================

ALTER TABLE booking_home_details ADD COLUMN IF NOT EXISTS home_service_type TEXT CHECK (home_service_type IN ('standard', 'deep', 'move_in_out', 'carpet'));

-- Update floorplan constraint to match new values
ALTER TABLE booking_home_details DROP CONSTRAINT IF EXISTS booking_home_details_floorplan_check;
ALTER TABLE booking_home_details ADD CONSTRAINT booking_home_details_floorplan_check
  CHECK (floorplan IN ('studio', '1bed_1bath', '2bed_1bath', '2bed_2bath', '3bed_plus'));

-- =====================================================
-- 4. JOB ADJUSTMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS job_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  adjusted_by UUID REFERENCES profiles(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add_service', 'condition_change', 'discount', 'surcharge', 'other')),
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- cents, positive = increase, negative = decrease
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. CREW PAYROLL TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crew_payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_member_id UUID NOT NULL REFERENCES profiles(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lead', 'helper')),
  total_jobs INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0,       -- cents
  total_commission INTEGER NOT NULL DEFAULT 0,    -- cents
  base_pay INTEGER NOT NULL DEFAULT 0,            -- cents
  review_bonus INTEGER NOT NULL DEFAULT 0,        -- cents
  weekly_bonus INTEGER NOT NULL DEFAULT 0,        -- cents
  total_pay INTEGER NOT NULL DEFAULT 0,           -- cents
  five_star_count INTEGER NOT NULL DEFAULT 0,
  breakdown_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. BOOKING REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  profile_id UUID REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  crew_member_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE job_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reviews ENABLE ROW LEVEL SECURITY;

-- job_adjustments policies
CREATE POLICY "Admin can manage job adjustments"
  ON job_adjustments FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

CREATE POLICY "Crew can view own job adjustments"
  ON job_adjustments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dispatch_assignments
      WHERE dispatch_assignments.booking_id = job_adjustments.booking_id
        AND dispatch_assignments.crew_member_id = auth.uid()
    )
  );

CREATE POLICY "Crew can insert job adjustments"
  ON job_adjustments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dispatch_assignments
      WHERE dispatch_assignments.booking_id = job_adjustments.booking_id
        AND dispatch_assignments.crew_member_id = auth.uid()
    )
  );

-- crew_payroll policies
CREATE POLICY "Admin can manage crew payroll"
  ON crew_payroll FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Crew can view own payroll"
  ON crew_payroll FOR SELECT
  USING (crew_member_id = auth.uid());

-- booking_reviews policies
CREATE POLICY "Anyone can view reviews"
  ON booking_reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "Customers can insert own reviews"
  ON booking_reviews FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admin can manage reviews"
  ON booking_reviews FOR ALL
  USING (get_user_role() = 'admin');

-- =====================================================
-- 8. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_job_adjustments_booking ON job_adjustments(booking_id);
CREATE INDEX IF NOT EXISTS idx_crew_payroll_member ON crew_payroll(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_payroll_period ON crew_payroll(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_crew_payroll_status ON crew_payroll(status);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_booking ON booking_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_crew ON booking_reviews(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_estimated_price ON bookings(estimated_price);
CREATE INDEX IF NOT EXISTS idx_bookings_final_price ON bookings(final_price);
CREATE INDEX IF NOT EXISTS idx_bookings_started_at ON bookings(started_at);
CREATE INDEX IF NOT EXISTS idx_bookings_completed_at ON bookings(completed_at);

-- =====================================================
-- 9. UPDATED_AT TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_crew_payroll_updated_at ON crew_payroll;
CREATE TRIGGER update_crew_payroll_updated_at
  BEFORE UPDATE ON crew_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
