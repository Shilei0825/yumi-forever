-- Update handle_new_user() to also link guest bookings by email/phone
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_phone TEXT;
BEGIN
  -- Create profile as before
  INSERT INTO profiles (id, role, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );

  -- Link existing guest bookings by email
  UPDATE bookings
  SET profile_id = NEW.id
  WHERE profile_id IS NULL
    AND customer_email = NEW.email;

  -- Also link by phone if provided and not empty
  user_phone := NEW.raw_user_meta_data->>'phone';
  IF user_phone IS NOT NULL AND user_phone != '' THEN
    UPDATE bookings
    SET profile_id = NEW.id
    WHERE profile_id IS NULL
      AND customer_phone = user_phone;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
