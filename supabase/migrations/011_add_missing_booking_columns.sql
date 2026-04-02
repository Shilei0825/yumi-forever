-- Migration 011: Add missing booking columns
-- These columns are needed by the booking creation API and detail pages

-- From migration 003 (not applied to bookings table)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS estimated_price INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_price INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_adjusted BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS auto_service_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS home_service_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_class TEXT;

-- From migration 004 (not applied to bookings table)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_balance INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_mode TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_profile_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prior_booking_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_discount_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_discount_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy_result TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refundable_deposit_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nonrefundable_reason TEXT;

-- Additional columns used by the booking API
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_option TEXT DEFAULT 'deposit';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_commitment_total INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurring_services_completed INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_estimated_price ON bookings(estimated_price);
CREATE INDEX IF NOT EXISTS idx_bookings_final_price ON bookings(final_price);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_profile ON bookings(recurring_profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_prior ON bookings(prior_booking_id);
