-- =====================================================
-- Migration 009: Price Appeals
-- Allows customers to request a price review for any
-- service. A technician will review and follow up with
-- a personalized quote.
-- =====================================================

-- =====================================================
-- 1. PRICE APPEALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS price_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_slug TEXT NOT NULL,
  service_name TEXT NOT NULL,
  quoted_price INTEGER NOT NULL,  -- in cents
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  contact_preference TEXT NOT NULL CHECK (contact_preference IN ('phone', 'text', 'email')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'denied')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE price_appeals ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a price appeal (public insert)
CREATE POLICY "Anyone can submit a price appeal"
  ON price_appeals FOR INSERT
  WITH CHECK (TRUE);

-- Admins can view all price appeals
CREATE POLICY "Admins can view price appeals"
  ON price_appeals FOR SELECT
  USING (get_user_role() = 'admin');

-- Admins can update price appeals (review, approve, deny)
CREATE POLICY "Admins can update price appeals"
  ON price_appeals FOR UPDATE
  USING (get_user_role() = 'admin');

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_price_appeals_status ON price_appeals(status);
CREATE INDEX IF NOT EXISTS idx_price_appeals_service ON price_appeals(service_slug);
CREATE INDEX IF NOT EXISTS idx_price_appeals_created ON price_appeals(created_at);
