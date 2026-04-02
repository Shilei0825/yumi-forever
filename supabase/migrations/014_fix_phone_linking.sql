-- Fix phone normalization in handle_new_user() trigger
-- The booking API normalizes phones (strips non-digits) before storing,
-- but the trigger compared raw phone strings. Fix to normalize both sides.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_phone TEXT;
  normalized_phone TEXT;
BEGIN
  -- Create profile
  INSERT INTO profiles (id, role, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);

  -- Link existing guest bookings by email (case-insensitive)
  UPDATE bookings
  SET profile_id = NEW.id
  WHERE profile_id IS NULL
    AND LOWER(customer_email) = LOWER(NEW.email);

  -- Also link by phone if provided (normalize both sides)
  user_phone := NEW.raw_user_meta_data->>'phone';
  IF user_phone IS NOT NULL AND user_phone != '' THEN
    normalized_phone := regexp_replace(user_phone, '\D', '', 'g');
    UPDATE bookings
    SET profile_id = NEW.id
    WHERE profile_id IS NULL
      AND regexp_replace(customer_phone, '\D', '', 'g') = normalized_phone;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
