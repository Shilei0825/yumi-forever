-- Migration 012: Fix booking constraints and sync services
-- service_id must be nullable since bookings can be created without matching a service
-- customer_phone and address_text should also be nullable for flexibility

ALTER TABLE bookings ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN customer_phone DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN address_text DROP NOT NULL;

-- Update services to match frontend constants (slugs must align)
DELETE FROM services;

-- Auto Care services
INSERT INTO services (category_id, name, slug, description, base_price, duration_minutes, requires_quote, requires_deposit, deposit_amount, is_active, sort_order)
VALUES
  ('a0000001-0001-4000-8000-000000000002', 'Express Exterior', 'express-exterior', 'Quick exterior wash and dry', 8500, 45, false, true, 2550, true, 1),
  ('a0000001-0001-4000-8000-000000000002', 'Express Interior', 'express-interior', 'Quick interior vacuum and wipe', 9500, 60, false, true, 2850, true, 2),
  ('a0000001-0001-4000-8000-000000000002', 'Express In & Out', 'express-in-out', 'Exterior wash plus interior clean', 14000, 90, false, true, 4200, true, 3),
  ('a0000001-0001-4000-8000-000000000002', 'Premium Exterior', 'premium-exterior', 'Full exterior detail with clay bar and sealant', 18000, 120, false, true, 5400, true, 4),
  ('a0000001-0001-4000-8000-000000000002', 'Premium Interior', 'premium-interior', 'Deep interior cleaning and conditioning', 22500, 150, false, true, 6750, true, 5),
  ('a0000001-0001-4000-8000-000000000002', 'Premium Detail', 'premium-detail', 'Complete premium inside and out detail', 32500, 240, false, true, 9750, true, 6);

-- Home Care services
INSERT INTO services (category_id, name, slug, description, base_price, duration_minutes, requires_quote, requires_deposit, deposit_amount, is_active, sort_order)
VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Standard Home Cleaning', 'standard-cleaning', 'Regular house cleaning service', 15000, 120, false, true, 4500, true, 1),
  ('a0000001-0001-4000-8000-000000000001', 'Deep Cleaning', 'deep-cleaning', 'Thorough deep cleaning of all areas', 25000, 180, false, true, 7500, true, 2),
  ('a0000001-0001-4000-8000-000000000001', 'Move-In/Move-Out Cleaning', 'move-in-move-out-cleaning', 'Complete clean for moving transitions', 30000, 240, false, true, 9000, true, 3),
  ('a0000001-0001-4000-8000-000000000001', 'Carpet Cleaning', 'carpet-cleaning', 'Professional carpet cleaning service', 12000, 90, false, true, 3600, true, 4);

-- Fleet/Commercial services
INSERT INTO services (category_id, name, slug, description, base_price, duration_minutes, requires_quote, requires_deposit, deposit_amount, is_active, sort_order)
VALUES
  ('a0000001-0001-4000-8000-000000000003', 'Fleet Wash', 'fleet-wash', 'Exterior wash for fleet vehicles', 0, 60, true, false, null, true, 1),
  ('a0000001-0001-4000-8000-000000000003', 'Fleet Detailing', 'fleet-detailing', 'Full detail for fleet vehicles', 0, 120, true, false, null, true, 2),
  ('a0000001-0001-4000-8000-000000000003', 'Commercial Contract', 'commercial-contract', 'Custom commercial cleaning contracts', 0, 0, true, false, null, true, 3);
