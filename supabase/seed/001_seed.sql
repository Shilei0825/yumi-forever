-- =====================================================
-- Yumi Care Seed Data
-- =====================================================
--
-- IMPORTANT: Dev Admin Account Setup
-- The dev admin account must be created manually via the Supabase Auth dashboard:
--   Email:    linda20010515@gmail.com
--   Password: 12345678
-- After creating the user in Authentication > Users, update the corresponding
-- profile record to set role = 'admin':
--   UPDATE profiles SET role = 'admin' WHERE email = 'linda20010515@gmail.com';
--

-- SERVICE CATEGORIES
INSERT INTO service_categories (id, name, slug, description, icon, sort_order) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Home Care', 'home-care', 'Professional home cleaning services', 'home', 1),
  ('a0000001-0001-4000-8000-000000000002', 'Auto Care', 'auto-care', 'Premium mobile car detailing', 'car', 2),
  ('a0000001-0001-4000-8000-000000000003', 'Truck & Fleet', 'truck-fleet', 'Commercial and fleet vehicle services', 'truck', 3);

-- HOME CARE SERVICES
INSERT INTO services (id, category_id, name, slug, description, base_price, duration_minutes, requires_quote, requires_deposit, deposit_amount, sort_order) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', 'Standard Home Cleaning', 'standard-home-cleaning', 'Full home clean including kitchen, bathrooms, and living areas.', 14900, 120, FALSE, FALSE, NULL, 1),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001', 'Deep Cleaning', 'deep-cleaning', 'Intensive deep clean with baseboards, inside cabinets, and appliances.', 24900, 240, FALSE, TRUE, 7500, 2),
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000001', 'Move In / Move Out Cleaning', 'move-in-move-out-cleaning', 'Complete cleaning for moving transitions.', 29900, 300, FALSE, TRUE, 10000, 3),
  ('b0000001-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000001', 'Carpet Cleaning', 'carpet-cleaning', 'Professional carpet steam cleaning and stain removal.', 19900, 120, FALSE, FALSE, NULL, 4);

-- AUTO CARE SERVICES
INSERT INTO services (id, category_id, name, slug, description, base_price, duration_minutes, requires_quote, requires_deposit, deposit_amount, sort_order) VALUES
  ('b0000002-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000002', 'Basic Exterior Wash', 'basic-exterior-wash', 'Hand wash, dry, tire shine, and window cleaning.', 4900, 45, FALSE, FALSE, NULL, 1),
  ('b0000002-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000002', 'Interior Detailing', 'interior-detailing', 'Vacuum, wipe down, leather conditioning, and odor elimination.', 14900, 120, FALSE, TRUE, 5000, 2),
  ('b0000002-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000002', 'Full Detailing', 'full-detailing', 'Complete interior and exterior detail with premium products.', 24900, 180, FALSE, TRUE, 7500, 3),
  ('b0000002-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000002', 'Headlight Restoration', 'headlight-restoration', 'Restore foggy, yellowed headlights to crystal clarity.', 8900, 60, FALSE, FALSE, NULL, 4),
  ('b0000002-0001-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000002', 'Paint Correction', 'paint-correction', 'Remove swirl marks, scratches, and oxidation for a showroom finish.', 39900, 360, TRUE, TRUE, 10000, 5),
  ('b0000002-0001-4000-8000-000000000006', 'a0000001-0001-4000-8000-000000000002', 'Ceramic Coating', 'ceramic-coating', 'Long-lasting ceramic protection for your vehicle''s paint.', 59900, 480, TRUE, TRUE, 15000, 6),
  ('b0000002-0001-4000-8000-000000000007', 'a0000001-0001-4000-8000-000000000002', 'Ding Repair', 'ding-repair', 'Paintless dent repair for minor dings and dents.', 0, 0, TRUE, FALSE, NULL, 7);

-- TRUCK & FLEET SERVICES
INSERT INTO services (id, category_id, name, slug, description, base_price, duration_minutes, requires_quote, requires_deposit, deposit_amount, sort_order) VALUES
  ('b0000003-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000003', 'Fleet Wash', 'fleet-wash', 'Exterior wash for fleet vehicles at your location.', 0, 0, TRUE, FALSE, NULL, 1),
  ('b0000003-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000003', 'Fleet Detailing', 'fleet-detailing', 'Full detail service for fleet vehicles.', 0, 0, TRUE, FALSE, NULL, 2),
  ('b0000003-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000003', 'Commercial Contract', 'commercial-contract', 'Recurring service contracts for businesses.', 0, 0, TRUE, FALSE, NULL, 3);

-- AUTO ADD-ONS
INSERT INTO service_addons (id, category_id, name, description, price) VALUES
  ('c0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000002', 'Pet Hair Removal', 'Extra vacuuming and lint rolling for pet hair', 2500),
  ('c0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000002', 'Engine Bay Cleaning', 'Degrease and detail engine bay', 3500),
  ('c0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000002', 'Odor Elimination', 'Ozone treatment for stubborn odors', 4500),
  ('c0000001-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000002', 'Leather Conditioning', 'Premium leather treatment and protection', 3000),
  ('c0000001-0001-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000002', 'Wheel Deep Clean', 'Brake dust removal and wheel polish', 2000);

-- HOME ADD-ONS
INSERT INTO service_addons (id, category_id, name, description, price) VALUES
  ('c0000002-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', 'Fridge Cleaning', 'Interior fridge deep clean', 3000),
  ('c0000002-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001', 'Oven Cleaning', 'Interior oven deep clean', 4000),
  ('c0000002-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000001', 'Window Cleaning (Interior)', 'All interior windows cleaned', 5000),
  ('c0000002-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000001', 'Laundry Service', 'Wash, dry, and fold one load', 2500),
  ('c0000002-0001-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000001', 'Garage Sweep', 'Sweep and organize garage floor', 3500);

-- CREW VEHICLES
INSERT INTO crew_vehicles (id, name, license_plate, type) VALUES
  ('d0000001-0001-4000-8000-000000000001', 'Van 1 - Mobile Detail Unit', 'YC-001', 'van'),
  ('d0000001-0001-4000-8000-000000000002', 'Van 2 - Home Crew', 'YC-002', 'van'),
  ('d0000001-0001-4000-8000-000000000003', 'Truck 1 - Fleet Unit', 'YC-003', 'truck');

-- PAYROLL PERIODS
INSERT INTO payroll_periods (id, start_date, end_date, status) VALUES
  ('e0000001-0001-4000-8000-000000000001', '2025-03-03', '2025-03-16', 'paid'),
  ('e0000001-0001-4000-8000-000000000002', '2025-03-17', '2025-03-30', 'open');

-- COMMERCIAL ACCOUNTS
INSERT INTO commercial_accounts (id, company_name, contact_name, contact_email, contact_phone, account_type) VALUES
  ('f0000001-0001-4000-8000-000000000001', 'Sunset Apartments', 'Maria Garcia', 'maria@sunsetapts.com', '(555) 234-5678', 'apartment'),
  ('f0000001-0001-4000-8000-000000000002', 'Valley Auto Group', 'James Chen', 'james@valleyauto.com', '(555) 345-6789', 'dealership'),
  ('f0000001-0001-4000-8000-000000000003', 'Metro Delivery Co', 'Sarah Johnson', 'sarah@metrodelivery.com', '(555) 456-7890', 'fleet');

-- COMMERCIAL LOCATIONS
INSERT INTO commercial_locations (id, account_id, name, address, city, state, zip_code, contact_name, contact_phone) VALUES
  ('f1000001-0001-4000-8000-000000000001', 'f0000001-0001-4000-8000-000000000001', 'Sunset Apartments - Main', '1200 Sunset Blvd', 'Los Angeles', 'CA', '90028', 'Maria Garcia', '(555) 234-5678'),
  ('f1000001-0001-4000-8000-000000000002', 'f0000001-0001-4000-8000-000000000002', 'Valley Auto - Downtown', '500 Main St', 'Los Angeles', 'CA', '90012', 'James Chen', '(555) 345-6789'),
  ('f1000001-0001-4000-8000-000000000003', 'f0000001-0001-4000-8000-000000000003', 'Metro Delivery - Depot', '800 Industrial Way', 'Los Angeles', 'CA', '90058', 'Sarah Johnson', '(555) 456-7890');

-- QUOTE REQUESTS
INSERT INTO quote_requests (name, email, phone, company_name, service_type, description, status) VALUES
  ('Robert Kim', 'robert@luxurycars.com', '(555) 567-8901', 'Luxury Auto Sales', 'Fleet Detailing', 'We have 25 vehicles that need weekly exterior wash and monthly full detail.', 'new'),
  ('Lisa Wang', 'lisa@greenview.com', '(555) 678-9012', 'Greenview Properties', 'Commercial Contract', 'Looking for bi-weekly cleaning of 3 apartment buildings, 50 units each.', 'contacted');
