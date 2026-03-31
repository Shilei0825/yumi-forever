-- =====================================================
-- Migration 004: Deposits, Recurring, Cancellation,
-- Vehicles, Properties, Payments
-- =====================================================

-- =====================================================
-- 1. CUSTOMER VEHICLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  vehicle_class TEXT CHECK (vehicle_class IN ('sedan', 'small_suv', 'large_suv', 'truck_van')),
  color TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. CUSTOMER PROPERTIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  unit TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CA',
  zip_code TEXT NOT NULL,
  sqft INTEGER,
  floorplan TEXT CHECK (floorplan IN ('studio', '1bed_1bath', '2bed_1bath', '2bed_2bath', '3bed_plus')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. PAYMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'remaining_balance', 'full', 'refund')),
  amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. RECURRING PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS recurring_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_category TEXT NOT NULL CHECK (service_category IN ('auto_care', 'home_care')),
  service_type TEXT NOT NULL,
  recurring_interval TEXT NOT NULL CHECK (recurring_interval IN ('weekly', 'biweekly', 'monthly')),
  vehicle_id UUID REFERENCES customer_vehicles(id),
  property_id UUID REFERENCES customer_properties(id),
  last_booking_id UUID REFERENCES bookings(id),
  last_price INTEGER,
  last_service_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  next_service_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. ALTER BOOKINGS — Deposit, Recurring, Cancellation
-- =====================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_balance INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'deposit_paid', 'partially_paid', 'paid', 'refunded', 'canceled'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_mode TEXT DEFAULT 'one_time'
  CHECK (recurring_mode IN ('one_time', 'weekly', 'biweekly', 'monthly'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_profile_id UUID REFERENCES recurring_profiles(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prior_booking_id UUID REFERENCES bookings(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_discount_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_discount_reason TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES customer_vehicles(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES customer_properties(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS same_asset_match TEXT CHECK (same_asset_match IN ('same_vehicle', 'same_property', 'none'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy_result TEXT CHECK (cancellation_policy_result IN ('refundable', 'nonrefundable'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refundable_deposit_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nonrefundable_reason TEXT;

-- Add sqft and bedroom/bathroom to home details
ALTER TABLE booking_home_details ADD COLUMN IF NOT EXISTS sqft INTEGER;
ALTER TABLE booking_home_details ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE booking_home_details ADD COLUMN IF NOT EXISTS bathrooms INTEGER;

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE customer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_profiles ENABLE ROW LEVEL SECURITY;

-- customer_vehicles
CREATE POLICY "Customers can manage own vehicles"
  ON customer_vehicles FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Admin can manage all vehicles"
  ON customer_vehicles FOR ALL
  USING (get_user_role() = 'admin');

-- customer_properties
CREATE POLICY "Customers can manage own properties"
  ON customer_properties FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Admin can manage all properties"
  ON customer_properties FOR ALL
  USING (get_user_role() = 'admin');

-- payments
CREATE POLICY "Customers can view own payments"
  ON payments FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admin can manage all payments"
  ON payments FOR ALL
  USING (get_user_role() = 'admin');

-- recurring_profiles
CREATE POLICY "Customers can manage own recurring"
  ON recurring_profiles FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Admin can manage all recurring"
  ON recurring_profiles FOR ALL
  USING (get_user_role() = 'admin');

-- =====================================================
-- 7. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_profile ON customer_vehicles(profile_id);
CREATE INDEX IF NOT EXISTS idx_properties_profile ON customer_properties(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_profile ON payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_recurring_profile ON recurring_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_profile ON bookings(recurring_profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_prior ON bookings(prior_booking_id);

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_customer_vehicles_updated_at ON customer_vehicles;
CREATE TRIGGER update_customer_vehicles_updated_at
  BEFORE UPDATE ON customer_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_customer_properties_updated_at ON customer_properties;
CREATE TRIGGER update_customer_properties_updated_at
  BEFORE UPDATE ON customer_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_recurring_profiles_updated_at ON recurring_profiles;
CREATE TRIGGER update_recurring_profiles_updated_at
  BEFORE UPDATE ON recurring_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
