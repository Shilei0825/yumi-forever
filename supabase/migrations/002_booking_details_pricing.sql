-- =====================================================
-- Migration 002: Booking Details & Pricing Rules
-- Adds detailed home/auto booking info, AI analysis
-- (with real OpenAI integration support), and
-- admin-configurable pricing rules.
-- =====================================================

-- =====================================================
-- 1. BOOKING HOME DETAILS
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_home_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  property_type TEXT,
  sqft INTEGER,
  floorplan TEXT CHECK (floorplan IN ('studio', '1bed_1bath', '2bed_1bath', '2bed_2bath', '3bed_2bath', '4plus_bed')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  dirtiness_level TEXT CHECK (dirtiness_level IN ('light', 'moderate', 'heavy', 'very_heavy')),
  last_cleaned TEXT CHECK (last_cleaned IN ('1_week', '2_weeks', '1_month', '1_3_months', '3_plus_months', 'not_sure')),
  has_pets BOOLEAN DEFAULT FALSE,
  special_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. BOOKING AUTO DETAILS
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_auto_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_class TEXT CHECK (vehicle_class IN ('sedan', 'coupe', 'suv', 'truck', 'van', 'large_suv', 'luxury_exotic')),
  dirtiness_level TEXT CHECK (dirtiness_level IN ('light', 'moderate', 'heavy', 'severe')),
  pet_hair BOOLEAN DEFAULT FALSE,
  stains BOOLEAN DEFAULT FALSE,
  smoke_odor BOOLEAN DEFAULT FALSE,
  oxidation BOOLEAN DEFAULT FALSE,
  scratches BOOLEAN DEFAULT FALSE,
  special_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. BOOKING AI ANALYSES (real OpenAI integration)
-- =====================================================
-- Drop and recreate to ensure correct schema for real
-- OpenAI image analysis support.

DROP TABLE IF EXISTS booking_ai_analyses CASCADE;

CREATE TABLE booking_ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('home', 'auto')),
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_count INTEGER NOT NULL DEFAULT 0,
  overall_dirtiness_score INTEGER CHECK (overall_dirtiness_score >= 1 AND overall_dirtiness_score <= 10),
  recommended_dirtiness_level TEXT,
  recommended_pricing_multiplier NUMERIC(4,2),
  confidence_score NUMERIC(3,2),
  summary TEXT,
  structured_result_json JSONB,
  raw_response_json JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. PRICING RULES (admin-configurable)
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_type TEXT NOT NULL, -- 'home_sqft', 'home_floorplan', 'home_dirtiness', 'home_last_cleaned', 'auto_vehicle_class', 'auto_dirtiness', 'auto_condition'
  category TEXT NOT NULL, -- 'home_care' or 'auto_care'
  key TEXT NOT NULL, -- e.g. 'light', 'moderate', 'sedan', '0-500', etc.
  value NUMERIC(10,2) NOT NULL, -- multiplier or flat amount (cents for base_price)
  value_type TEXT NOT NULL DEFAULT 'multiplier' CHECK (value_type IN ('multiplier', 'flat_addition', 'base_price')),
  service_id UUID REFERENCES services(id), -- optional: specific to a service
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. ALTER BOOKINGS TABLE
-- =====================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_category TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pricing_breakdown JSONB;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ai_analysis_used BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ai_estimate_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_estimate_amount INTEGER;

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE booking_home_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_auto_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- --- booking_home_details policies ---

-- Drop existing policies first to make migration idempotent
DROP POLICY IF EXISTS "Customers can view own home details" ON booking_home_details;
DROP POLICY IF EXISTS "Customers can insert own home details" ON booking_home_details;
DROP POLICY IF EXISTS "Customers can update own home details" ON booking_home_details;
DROP POLICY IF EXISTS "Crew can view assigned home details" ON booking_home_details;
DROP POLICY IF EXISTS "Admin can view all home details" ON booking_home_details;
DROP POLICY IF EXISTS "Admin can manage home details" ON booking_home_details;

-- Customers can view their own home details (via booking ownership)
CREATE POLICY "Customers can view own home details"
  ON booking_home_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_home_details.booking_id
        AND bookings.profile_id = auth.uid()
    )
  );

-- Customers can insert home details for their own bookings
CREATE POLICY "Customers can insert own home details"
  ON booking_home_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_home_details.booking_id
        AND bookings.profile_id = auth.uid()
    )
  );

-- Customers can update home details for their own bookings
CREATE POLICY "Customers can update own home details"
  ON booking_home_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_home_details.booking_id
        AND bookings.profile_id = auth.uid()
    )
  );

-- Crew can view home details for assigned bookings
CREATE POLICY "Crew can view assigned home details"
  ON booking_home_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dispatch_assignments
      WHERE dispatch_assignments.booking_id = booking_home_details.booking_id
        AND dispatch_assignments.crew_member_id = auth.uid()
    )
  );

-- Admin/dispatcher can view all home details
CREATE POLICY "Admin can view all home details"
  ON booking_home_details FOR SELECT
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- Admin can fully manage home details
CREATE POLICY "Admin can manage home details"
  ON booking_home_details FOR ALL
  USING (get_user_role() = 'admin');

-- --- booking_auto_details policies ---

DROP POLICY IF EXISTS "Customers can view own auto details" ON booking_auto_details;
DROP POLICY IF EXISTS "Customers can insert own auto details" ON booking_auto_details;
DROP POLICY IF EXISTS "Customers can update own auto details" ON booking_auto_details;
DROP POLICY IF EXISTS "Crew can view assigned auto details" ON booking_auto_details;
DROP POLICY IF EXISTS "Admin can view all auto details" ON booking_auto_details;
DROP POLICY IF EXISTS "Admin can manage auto details" ON booking_auto_details;

-- Customers can view their own auto details (via booking ownership)
CREATE POLICY "Customers can view own auto details"
  ON booking_auto_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_auto_details.booking_id
        AND bookings.profile_id = auth.uid()
    )
  );

-- Customers can insert auto details for their own bookings
CREATE POLICY "Customers can insert own auto details"
  ON booking_auto_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_auto_details.booking_id
        AND bookings.profile_id = auth.uid()
    )
  );

-- Customers can update auto details for their own bookings
CREATE POLICY "Customers can update own auto details"
  ON booking_auto_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_auto_details.booking_id
        AND bookings.profile_id = auth.uid()
    )
  );

-- Crew can view auto details for assigned bookings
CREATE POLICY "Crew can view assigned auto details"
  ON booking_auto_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dispatch_assignments
      WHERE dispatch_assignments.booking_id = booking_auto_details.booking_id
        AND dispatch_assignments.crew_member_id = auth.uid()
    )
  );

-- Admin/dispatcher can view all auto details
CREATE POLICY "Admin can view all auto details"
  ON booking_auto_details FOR SELECT
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- Admin can fully manage auto details
CREATE POLICY "Admin can manage auto details"
  ON booking_auto_details FOR ALL
  USING (get_user_role() = 'admin');

-- --- booking_ai_analyses policies ---
-- (Table was dropped and recreated, so no need to drop policies)

-- Customers can view their own AI analyses (via booking ownership)
CREATE POLICY "Customers can view own ai analyses"
  ON booking_ai_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_ai_analyses.booking_id
        AND bookings.profile_id = auth.uid()
    )
  );

-- Admin can view all AI analyses
CREATE POLICY "Admin can view all ai analyses"
  ON booking_ai_analyses FOR SELECT
  USING (get_user_role() = 'admin');

-- Admin can fully manage AI analyses
CREATE POLICY "Admin can manage ai analyses"
  ON booking_ai_analyses FOR ALL
  USING (get_user_role() = 'admin');

-- System can insert AI analyses (service role or via function)
CREATE POLICY "Insert ai analyses"
  ON booking_ai_analyses FOR INSERT
  WITH CHECK (TRUE);

-- System can update AI analyses (for status transitions: pending -> processing -> completed/failed)
CREATE POLICY "Update ai analyses"
  ON booking_ai_analyses FOR UPDATE
  USING (TRUE);

-- --- pricing_rules policies ---

DROP POLICY IF EXISTS "Anyone can view pricing rules" ON pricing_rules;
DROP POLICY IF EXISTS "Admin can manage pricing rules" ON pricing_rules;

-- Anyone can SELECT pricing rules (needed for client-side price calculation)
CREATE POLICY "Anyone can view pricing rules"
  ON pricing_rules FOR SELECT
  USING (TRUE);

-- Admin can fully manage pricing rules
CREATE POLICY "Admin can manage pricing rules"
  ON pricing_rules FOR ALL
  USING (get_user_role() = 'admin');

-- =====================================================
-- 7. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_home_details_booking ON booking_home_details(booking_id);
CREATE INDEX IF NOT EXISTS idx_auto_details_booking ON booking_auto_details(booking_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_booking ON booking_ai_analyses(booking_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON booking_ai_analyses(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_booking_type ON booking_ai_analyses(booking_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_category ON pricing_rules(category);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);

-- =====================================================
-- 8. UPDATED_AT TRIGGERS
-- =====================================================

-- Trigger for pricing_rules
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for booking_ai_analyses
DROP TRIGGER IF EXISTS update_booking_ai_analyses_updated_at ON booking_ai_analyses;
CREATE TRIGGER update_booking_ai_analyses_updated_at
  BEFORE UPDATE ON booking_ai_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 9. SEED DEFAULT PRICING RULES
-- =====================================================

INSERT INTO pricing_rules (rule_type, category, key, value, value_type, description, sort_order) VALUES

-- Home dirtiness multipliers
('home_dirtiness', 'home_care', 'light', 1.00, 'multiplier', 'Light dirtiness — recently maintained', 1),
('home_dirtiness', 'home_care', 'moderate', 1.15, 'multiplier', 'Moderate dirtiness — some buildup', 2),
('home_dirtiness', 'home_care', 'heavy', 1.35, 'multiplier', 'Heavy dirtiness — significant buildup', 3),
('home_dirtiness', 'home_care', 'very_heavy', 1.55, 'multiplier', 'Very heavy dirtiness — deep clean needed', 4),

-- Home last_cleaned multipliers
('home_last_cleaned', 'home_care', '1_week', 1.00, 'multiplier', 'Cleaned within the last week', 1),
('home_last_cleaned', 'home_care', '2_weeks', 1.00, 'multiplier', 'Cleaned within the last 2 weeks', 2),
('home_last_cleaned', 'home_care', '1_month', 1.10, 'multiplier', 'Cleaned within the last month', 3),
('home_last_cleaned', 'home_care', '1_3_months', 1.20, 'multiplier', 'Cleaned 1-3 months ago', 4),
('home_last_cleaned', 'home_care', '3_plus_months', 1.35, 'multiplier', 'Not cleaned in 3+ months', 5),
('home_last_cleaned', 'home_care', 'not_sure', 1.15, 'multiplier', 'Not sure when last cleaned', 6),

-- Home floorplan base prices (in cents)
('home_floorplan', 'home_care', 'studio', 9900.00, 'base_price', 'Studio apartment base price', 1),
('home_floorplan', 'home_care', '1bed_1bath', 12900.00, 'base_price', '1 bedroom / 1 bathroom base price', 2),
('home_floorplan', 'home_care', '2bed_1bath', 14900.00, 'base_price', '2 bedrooms / 1 bathroom base price', 3),
('home_floorplan', 'home_care', '2bed_2bath', 16900.00, 'base_price', '2 bedrooms / 2 bathrooms base price', 4),
('home_floorplan', 'home_care', '3bed_2bath', 19900.00, 'base_price', '3 bedrooms / 2 bathrooms base price', 5),
('home_floorplan', 'home_care', '4plus_bed', 24900.00, 'base_price', '4+ bedrooms base price', 6),

-- Home sqft range multipliers
('home_sqft', 'home_care', '0-500', 0.85, 'multiplier', 'Under 500 sqft — small space discount', 1),
('home_sqft', 'home_care', '501-1000', 1.00, 'multiplier', '501-1000 sqft — standard', 2),
('home_sqft', 'home_care', '1001-1500', 1.15, 'multiplier', '1001-1500 sqft', 3),
('home_sqft', 'home_care', '1501-2000', 1.30, 'multiplier', '1501-2000 sqft', 4),
('home_sqft', 'home_care', '2001-2500', 1.45, 'multiplier', '2001-2500 sqft', 5),
('home_sqft', 'home_care', '2501+', 1.60, 'multiplier', '2501+ sqft — large home', 6),

-- Auto vehicle class multipliers
('auto_vehicle_class', 'auto_care', 'sedan', 1.00, 'multiplier', 'Sedan — standard size', 1),
('auto_vehicle_class', 'auto_care', 'coupe', 1.00, 'multiplier', 'Coupe — standard size', 2),
('auto_vehicle_class', 'auto_care', 'suv', 1.20, 'multiplier', 'SUV — larger vehicle', 3),
('auto_vehicle_class', 'auto_care', 'truck', 1.25, 'multiplier', 'Truck — larger vehicle with bed', 4),
('auto_vehicle_class', 'auto_care', 'van', 1.30, 'multiplier', 'Van — larger interior', 5),
('auto_vehicle_class', 'auto_care', 'large_suv', 1.35, 'multiplier', 'Large SUV — full-size vehicle', 6),
('auto_vehicle_class', 'auto_care', 'luxury_exotic', 1.50, 'multiplier', 'Luxury / exotic — premium handling', 7),

-- Auto dirtiness multipliers
('auto_dirtiness', 'auto_care', 'light', 1.00, 'multiplier', 'Light dirtiness — regular wash', 1),
('auto_dirtiness', 'auto_care', 'moderate', 1.15, 'multiplier', 'Moderate dirtiness — extra attention needed', 2),
('auto_dirtiness', 'auto_care', 'heavy', 1.35, 'multiplier', 'Heavy dirtiness — significant cleaning', 3),
('auto_dirtiness', 'auto_care', 'severe', 1.55, 'multiplier', 'Severe dirtiness — restoration-level clean', 4),

-- Auto condition add-on prices (flat additions in cents)
('auto_condition', 'auto_care', 'pet_hair', 2500.00, 'flat_addition', 'Pet hair removal add-on', 1),
('auto_condition', 'auto_care', 'stains', 2000.00, 'flat_addition', 'Stain treatment add-on', 2),
('auto_condition', 'auto_care', 'smoke_odor', 3500.00, 'flat_addition', 'Smoke/odor treatment add-on', 3),
('auto_condition', 'auto_care', 'oxidation', 0.00, 'flat_addition', 'Oxidation correction — quote required', 4),
('auto_condition', 'auto_care', 'scratches', 0.00, 'flat_addition', 'Scratch repair — quote required', 5)

ON CONFLICT DO NOTHING;
