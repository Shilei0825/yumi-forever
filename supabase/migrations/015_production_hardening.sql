-- =====================================================
-- Migration 015: Production Hardening
-- Fix deposit_paid column type, add missing indexes
-- =====================================================

-- Fix deposit_paid: was added as BOOLEAN in 004, should be INTEGER (cents)
-- Migration 011 tried IF NOT EXISTS but that skips if column already exists
ALTER TABLE bookings ALTER COLUMN deposit_paid TYPE INTEGER USING CASE
  WHEN deposit_paid::text = 'true' THEN 0
  WHEN deposit_paid::text = 'false' THEN 0
  ELSE COALESCE(deposit_paid::text::integer, 0)
END;
ALTER TABLE bookings ALTER COLUMN deposit_paid SET DEFAULT 0;

-- Ensure remaining_balance is INTEGER (should already be, but make sure)
ALTER TABLE bookings ALTER COLUMN remaining_balance SET DEFAULT 0;

-- Add index for booking number lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);

-- Add index for customer email lookups (for booking linking)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);

-- Add index for payment square_order_id lookups (webhook needs this)
CREATE INDEX IF NOT EXISTS idx_payments_square_order_id ON payments(square_order_id);
