-- =====================================================
-- Yumi Care Database Schema
-- Premium On-Demand Home & Auto Services
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES & AUTH
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'crew', 'dispatcher', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ADDRESSES & VEHICLES
-- =====================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  street TEXT NOT NULL,
  unit TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CA',
  zip_code TEXT NOT NULL,
  gate_code TEXT,
  parking_instructions TEXT,
  property_type TEXT CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'commercial')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'sedan' CHECK (type IN ('sedan', 'suv', 'truck', 'van', 'coupe', 'convertible', 'other')),
  license_plate TEXT,
  condition_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SERVICE CATALOG
-- =====================================================

CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'wrench',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  base_price INTEGER NOT NULL DEFAULT 0, -- cents
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  requires_quote BOOLEAN NOT NULL DEFAULT FALSE,
  requires_deposit BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_amount INTEGER, -- cents
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE service_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0, -- cents
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- BOOKINGS
-- =====================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT NOT NULL UNIQUE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'pending_quote', 'quote_sent', 'confirmed',
    'assigned', 'on_the_way', 'in_progress', 'completed', 'canceled'
  )),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  estimated_duration INTEGER NOT NULL DEFAULT 60,
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  address_text TEXT NOT NULL DEFAULT '',
  gate_code TEXT,
  parking_instructions TEXT,
  vehicle_info TEXT,
  service_notes TEXT,
  internal_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  started_by UUID REFERENCES profiles(id),
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES service_addons(id),
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CREW & DISPATCH
-- =====================================================

CREATE TABLE crew_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  license_plate TEXT,
  type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE dispatch_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES profiles(id),
  crew_vehicle_id UUID REFERENCES crew_vehicles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- PHOTOS
-- =====================================================

CREATE TABLE uploaded_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  photo_type TEXT NOT NULL DEFAULT 'other' CHECK (photo_type IN ('condition', 'before', 'after', 'other')),
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN (
    'unpaid', 'deposit_paid', 'paid', 'partially_paid', 'refunded', 'failed'
  )),
  payment_type TEXT NOT NULL DEFAULT 'full' CHECK (payment_type IN (
    'deposit', 'balance', 'full', 'tip', 'refund'
  )),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'void')),
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTIONS / MEMBERSHIPS
-- =====================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PAYROLL
-- =====================================================

CREATE TABLE crew_pay_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  pay_type TEXT NOT NULL DEFAULT 'per_job' CHECK (pay_type IN ('hourly', 'per_job')),
  hourly_rate INTEGER, -- cents
  per_job_rate INTEGER, -- cents
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_member_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  period_id UUID REFERENCES payroll_periods(id),
  pay_amount INTEGER NOT NULL DEFAULT 0, -- cents
  bonus_amount INTEGER NOT NULL DEFAULT 0,
  tip_amount INTEGER NOT NULL DEFAULT 0,
  hours_worked NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- REVIEWS
-- =====================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- COMMERCIAL
-- =====================================================

CREATE TABLE commercial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL CHECK (account_type IN ('apartment', 'dealership', 'fleet', 'commercial')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE commercial_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES commercial_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CA',
  zip_code TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT
);

CREATE TABLE commercial_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES commercial_accounts(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  frequency TEXT NOT NULL DEFAULT 'weekly',
  price_per_visit INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  company_name TEXT,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'converted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS (placeholder)
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY LOG
-- =====================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_bookings_profile ON bookings(profile_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_number ON bookings(booking_number);
CREATE INDEX idx_dispatch_booking ON dispatch_assignments(booking_id);
CREATE INDEX idx_dispatch_crew ON dispatch_assignments(crew_member_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payroll_crew ON payroll_entries(crew_member_id);
CREATE INDEX idx_payroll_period ON payroll_entries(period_id);
CREATE INDEX idx_photos_booking ON uploaded_photos(booking_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_notifications_profile ON notifications(profile_id);
CREATE INDEX idx_addresses_profile ON addresses(profile_id);
CREATE INDEX idx_vehicles_profile ON vehicles(profile_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_pay_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles: users can read their own, admin/dispatcher can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (get_user_role() IN ('admin', 'dispatcher'));
CREATE POLICY "Admin can update all profiles" ON profiles FOR UPDATE USING (get_user_role() = 'admin');

-- Service catalog: public read
CREATE POLICY "Anyone can view categories" ON service_categories FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage categories" ON service_categories FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage services" ON services FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can view addons" ON service_addons FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage addons" ON service_addons FOR ALL USING (get_user_role() = 'admin');

-- Addresses: own data only
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Admin can view all addresses" ON addresses FOR SELECT USING (get_user_role() IN ('admin', 'dispatcher'));

-- Vehicles: own data only
CREATE POLICY "Users can manage own vehicles" ON vehicles FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Admin can view all vehicles" ON vehicles FOR SELECT USING (get_user_role() IN ('admin', 'dispatcher'));

-- Bookings: customers see own, crew see assigned, dispatch/admin see all
CREATE POLICY "Customers can view own bookings" ON bookings FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Customers can create bookings" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Crew can view assigned bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM dispatch_assignments WHERE booking_id = bookings.id AND crew_member_id = auth.uid())
);
CREATE POLICY "Crew can update assigned bookings" ON bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM dispatch_assignments WHERE booking_id = bookings.id AND crew_member_id = auth.uid())
);
CREATE POLICY "Dispatch can view all bookings" ON bookings FOR SELECT USING (get_user_role() IN ('admin', 'dispatcher'));
CREATE POLICY "Dispatch can update bookings" ON bookings FOR UPDATE USING (get_user_role() IN ('admin', 'dispatcher'));
CREATE POLICY "Admin can manage all bookings" ON bookings FOR ALL USING (get_user_role() = 'admin');

-- Booking items: follow booking access
CREATE POLICY "View booking items" ON booking_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND (profile_id = auth.uid() OR get_user_role() IN ('admin', 'dispatcher')))
);
CREATE POLICY "Admin can manage booking items" ON booking_items FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Insert booking items" ON booking_items FOR INSERT WITH CHECK (TRUE);

-- Booking status history: follow booking access
CREATE POLICY "View status history" ON booking_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND (profile_id = auth.uid() OR get_user_role() IN ('admin', 'dispatcher', 'crew')))
);
CREATE POLICY "Insert status history" ON booking_status_history FOR INSERT WITH CHECK (TRUE);

-- Dispatch assignments
CREATE POLICY "Crew can view own assignments" ON dispatch_assignments FOR SELECT USING (crew_member_id = auth.uid());
CREATE POLICY "Dispatch can manage assignments" ON dispatch_assignments FOR ALL USING (get_user_role() IN ('admin', 'dispatcher'));

-- Photos
CREATE POLICY "Users can view related photos" ON uploaded_photos FOR SELECT USING (
  uploaded_by = auth.uid() OR get_user_role() IN ('admin', 'dispatcher') OR
  EXISTS (SELECT 1 FROM dispatch_assignments WHERE booking_id = uploaded_photos.booking_id AND crew_member_id = auth.uid())
);
CREATE POLICY "Users can upload photos" ON uploaded_photos FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Admin can manage photos" ON uploaded_photos FOR ALL USING (get_user_role() = 'admin');

-- Payments
CREATE POLICY "Customers can view own payments" ON payments FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admin can manage payments" ON payments FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Insert payments" ON payments FOR INSERT WITH CHECK (TRUE);

-- Invoices
CREATE POLICY "Customers can view own invoices" ON invoices FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admin can manage invoices" ON invoices FOR ALL USING (get_user_role() = 'admin');

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admin can manage subscriptions" ON subscriptions FOR ALL USING (get_user_role() = 'admin');

-- Payroll: crew sees own, admin sees all
CREATE POLICY "Crew can view own pay profile" ON crew_pay_profiles FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admin can manage pay profiles" ON crew_pay_profiles FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Anyone can view payroll periods" ON payroll_periods FOR SELECT USING (get_user_role() IN ('admin', 'crew'));
CREATE POLICY "Admin can manage payroll periods" ON payroll_periods FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Crew can view own payroll" ON payroll_entries FOR SELECT USING (crew_member_id = auth.uid());
CREATE POLICY "Admin can manage payroll" ON payroll_entries FOR ALL USING (get_user_role() = 'admin');

-- Reviews
CREATE POLICY "Anyone can view published reviews" ON reviews FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Admin can manage reviews" ON reviews FOR ALL USING (get_user_role() = 'admin');

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Insert notifications" ON notifications FOR INSERT WITH CHECK (TRUE);

-- Commercial (admin only)
CREATE POLICY "Admin can manage commercial accounts" ON commercial_accounts FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Admin can view commercial accounts" ON commercial_accounts FOR SELECT USING (get_user_role() IN ('admin', 'dispatcher'));
CREATE POLICY "Admin can manage commercial locations" ON commercial_locations FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Admin can manage commercial contracts" ON commercial_contracts FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Admin can manage quote requests" ON quote_requests FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Insert quote requests" ON quote_requests FOR INSERT WITH CHECK (TRUE);

-- Activity logs
CREATE POLICY "Admin can view activity logs" ON activity_logs FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Insert activity logs" ON activity_logs FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
-- CREATE POLICY "Users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
