-- Add unique constraint on phone number (non-null, non-empty only)
-- Prevents duplicate accounts with the same phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
ON profiles (phone)
WHERE phone IS NOT NULL AND phone != '';
