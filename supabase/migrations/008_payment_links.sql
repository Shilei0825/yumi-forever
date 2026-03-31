-- =====================================================
-- Migration 008: Payment Links
-- Allows admins to generate unique payment links
-- for customers to pay remaining balances online.
-- =====================================================

-- =====================================================
-- 1. PAYMENT LINKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,  -- in cents
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Anyone can look up a payment link by token (public access for customers)
CREATE POLICY "Anyone can select payment links by token"
  ON payment_links FOR SELECT
  USING (TRUE);

-- Admins can insert payment links
CREATE POLICY "Admins can insert payment links"
  ON payment_links FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- Admins can update payment links (e.g., marking as paid)
CREATE POLICY "Admins can update payment links"
  ON payment_links FOR UPDATE
  USING (get_user_role() = 'admin');

-- Service role bypass for API routes that use service role
-- (handled by supabase service client which bypasses RLS)

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_links_token ON payment_links(token);
CREATE INDEX IF NOT EXISTS idx_payment_links_booking ON payment_links(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_expires ON payment_links(expires_at);
