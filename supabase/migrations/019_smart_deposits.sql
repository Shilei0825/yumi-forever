-- Smart Deposit System: first-time customers skip deposit,
-- violations (no-show / late cancellation) require deposit on next booking.

-- 1. Customer violations table
CREATE TABLE IF NOT EXISTS customer_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_email TEXT,
  customer_phone TEXT,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('no_show', 'late_cancellation')),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_email ON customer_violations(customer_email);
CREATE INDEX IF NOT EXISTS idx_violations_phone ON customer_violations(customer_phone);

-- 2. Add 'no_show' to allowed booking statuses
-- Drop old constraint and re-add with no_show included
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check1;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('new','pending_quote','quote_sent','confirmed','assigned','on_the_way','in_progress','completed','canceled','canceled_refundable','canceled_nonrefundable','no_show'));

-- 3. Add deposit_waived flag to bookings (tracks when deposit was skipped for first-timer)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_waived BOOLEAN DEFAULT false;
