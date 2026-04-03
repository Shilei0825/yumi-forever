-- ============================================================================
-- 016: Review Rewards + Payroll Automation
-- ============================================================================

-- Review credits (customer rewards for leaving reviews)
CREATE TABLE IF NOT EXISTS review_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,           -- cents
  remaining INTEGER NOT NULL,        -- cents (decremented when used)
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired')),
  used_on_booking_id UUID REFERENCES bookings(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  CONSTRAINT unique_review_credit UNIQUE (review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_credits_profile ON review_credits(profile_id);
CREATE INDEX IF NOT EXISTS idx_review_credits_status ON review_credits(status);
CREATE INDEX IF NOT EXISTS idx_review_credits_expires ON review_credits(expires_at);

-- RLS for review_credits
ALTER TABLE review_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON review_credits FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage credits"
  ON review_credits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Track whether credit was issued for a review
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS credit_issued BOOLEAN NOT NULL DEFAULT false;

-- Track crew role on dispatch assignments
ALTER TABLE dispatch_assignments ADD COLUMN IF NOT EXISTS crew_role TEXT
  CHECK (crew_role IN ('lead', 'helper')) DEFAULT 'helper';

-- Track review credit applied to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_credit_applied INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_credit_id UUID REFERENCES review_credits(id);

-- Track which review triggered a payroll bonus
ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES reviews(id);
