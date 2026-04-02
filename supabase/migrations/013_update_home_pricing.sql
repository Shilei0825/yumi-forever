-- 013: Update home service pricing and add carpet/building type columns
-- Adjusts home cleaning prices to be competitive in NJ/NYC market
-- Adds carpet_type and building_type to booking_home_details

-- Update home service prices in the services table
UPDATE services SET base_price = 13000, deposit_amount = 5000 WHERE slug = 'standard-cleaning';
UPDATE services SET base_price = 22000, deposit_amount = 7500 WHERE slug = 'deep-cleaning';
UPDATE services SET base_price = 26000, deposit_amount = 9000 WHERE slug = 'move-in-move-out-cleaning';
UPDATE services SET base_price = 10000, deposit_amount = 4000 WHERE slug = 'carpet-cleaning';

-- Add carpet_type and building_type to booking_home_details
ALTER TABLE booking_home_details
  ADD COLUMN IF NOT EXISTS carpet_type text,
  ADD COLUMN IF NOT EXISTS building_type text;
