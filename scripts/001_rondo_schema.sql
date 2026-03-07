-- Rondo Sportsbar Admin Dashboard - Database Schema

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.settings (key, value) VALUES
  ('opening_hours', '{"monday":{"open":"14:00","close":"02:00","enabled":true},"tuesday":{"open":"14:00","close":"02:00","enabled":true},"wednesday":{"open":"14:00","close":"02:00","enabled":true},"thursday":{"open":"14:00","close":"02:00","enabled":true},"friday":{"open":"14:00","close":"03:00","enabled":true},"saturday":{"open":"12:00","close":"03:00","enabled":true},"sunday":{"open":"12:00","close":"02:00","enabled":true}}'),
  ('areas', '[{"id":"billard","name":"Billard Tisch","enabled":true},{"id":"salitos","name":"Salitos Lounge / Outdoor","enabled":true},{"id":"restaurant140","name":"Restaurant 140 Zoll","enabled":true},{"id":"restaurant75","name":"Restaurant 75 Zoll / Sport","enabled":true},{"id":"vip","name":"VIP Raum / Sport","enabled":true}]'),
  ('booking_rules', '{"min_lead_minutes":30,"max_duration_minutes":{"billard":120,"salitos":180,"restaurant140":240,"restaurant75":180,"vip":300},"max_party_size":50}'),
  ('notifications', '{"admin_email_alerts":true,"manager_email":"manager@rondo-sportsbar.de"}'),
  ('email_sender', '{"name":"Rondo Sportsbar","address":"onboarding@resend.dev"}')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- AREAS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO public.areas (id, name, enabled, sort_order) VALUES
  ('billard', 'Billard Tisch', true, 1),
  ('salitos', 'Salitos Lounge / Outdoor', true, 2),
  ('restaurant140', 'Restaurant 140 Zoll', true, 3),
  ('restaurant75', 'Restaurant 75 Zoll / Sport', true, 4),
  ('vip', 'VIP Raum / Sport', true, 5)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- TABLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  area_id TEXT NOT NULL REFERENCES public.areas(id),
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'free' CHECK (status IN ('free', 'reserved', 'occupied', 'blocked')),
  blocked_reason TEXT,
  pos_x FLOAT DEFAULT 0,
  pos_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 80,
  height FLOAT DEFAULT 80,
  table_type TEXT DEFAULT 'restaurant' CHECK (table_type IN ('restaurant', 'billiard')),
  UNIQUE(number, area_id)
);

-- Restaurant 140 Zoll tables
INSERT INTO public.tables (number, area_id, capacity, pos_x, pos_y, width, height, table_type) VALUES
  ('50', 'restaurant140', 6, 120, 80, 90, 90, 'restaurant'),
  ('51', 'restaurant140', 6, 260, 80, 90, 90, 'restaurant'),
  ('52', 'restaurant140', 6, 400, 80, 90, 90, 'restaurant'),
  ('53', 'restaurant140', 8, 120, 220, 90, 90, 'restaurant'),
  ('54', 'restaurant140', 8, 260, 220, 90, 90, 'restaurant'),
  ('58', 'restaurant140', 6, 400, 220, 90, 90, 'restaurant'),
  ('59', 'restaurant140', 6, 120, 360, 90, 90, 'restaurant'),
  ('60', 'restaurant140', 8, 260, 360, 90, 90, 'restaurant'),
  ('66', 'restaurant140', 10, 450, 360, 90, 90, 'restaurant'),
  ('67', 'restaurant140', 10, 580, 360, 90, 90, 'restaurant')
ON CONFLICT (number, area_id) DO NOTHING;

-- Restaurant 75 Zoll tables
INSERT INTO public.tables (number, area_id, capacity, pos_x, pos_y, width, height, table_type) VALUES
  ('101', 'restaurant75', 4, 100, 100, 90, 90, 'restaurant'),
  ('102', 'restaurant75', 4, 250, 100, 90, 90, 'restaurant'),
  ('103', 'restaurant75', 4, 400, 100, 90, 90, 'restaurant'),
  ('104', 'restaurant75', 6, 100, 260, 90, 90, 'restaurant'),
  ('105', 'restaurant75', 6, 250, 260, 90, 90, 'restaurant'),
  ('106', 'restaurant75', 6, 400, 260, 90, 90, 'restaurant')
ON CONFLICT (number, area_id) DO NOTHING;

-- VIP Raum tables
INSERT INTO public.tables (number, area_id, capacity, pos_x, pos_y, width, height, table_type) VALUES
  ('101', 'vip', 6, 100, 100, 100, 100, 'restaurant'),
  ('102', 'vip', 6, 280, 100, 100, 100, 'restaurant'),
  ('103', 'vip', 8, 460, 100, 100, 100, 'restaurant'),
  ('104', 'vip', 8, 100, 280, 100, 100, 'restaurant'),
  ('105', 'vip', 10, 280, 280, 100, 100, 'restaurant'),
  ('106', 'vip', 10, 460, 280, 100, 100, 'restaurant')
ON CONFLICT (number, area_id) DO NOTHING;

-- Billard Tisch tables
INSERT INTO public.tables (number, area_id, capacity, pos_x, pos_y, width, height, table_type) VALUES
  ('B1', 'billard', 4, 60, 80, 130, 70, 'billiard'),
  ('B2', 'billard', 4, 250, 80, 130, 70, 'billiard'),
  ('B3', 'billard', 4, 440, 80, 130, 70, 'billiard'),
  ('B4', 'billard', 4, 60, 220, 130, 70, 'billiard'),
  ('B5', 'billard', 4, 250, 220, 130, 70, 'billiard'),
  ('B6', 'billard', 4, 440, 220, 130, 70, 'billiard'),
  ('B7', 'billard', 4, 60, 360, 130, 70, 'billiard'),
  ('B8', 'billard', 4, 250, 360, 130, 70, 'billiard'),
  ('10', 'billard', 4, 500, 360, 90, 90, 'restaurant'),
  ('30', 'billard', 6, 620, 360, 90, 90, 'restaurant')
ON CONFLICT (number, area_id) DO NOTHING;

-- Salitos Lounge tables
INSERT INTO public.tables (number, area_id, capacity, pos_x, pos_y, width, height, table_type) VALUES
  ('S1', 'salitos', 4, 80, 80, 90, 90, 'restaurant'),
  ('S2', 'salitos', 4, 220, 80, 90, 90, 'restaurant'),
  ('S3', 'salitos', 4, 360, 80, 90, 90, 'restaurant'),
  ('S4', 'salitos', 6, 80, 220, 90, 90, 'restaurant'),
  ('S5', 'salitos', 6, 220, 220, 90, 90, 'restaurant'),
  ('S6', 'salitos', 8, 360, 220, 90, 90, 'restaurant'),
  ('S7', 'salitos', 4, 500, 80, 90, 90, 'restaurant'),
  ('S8', 'salitos', 4, 500, 220, 90, 90, 'restaurant')
ON CONFLICT (number, area_id) DO NOTHING;

-- =============================================
-- RESERVATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  area_id TEXT NOT NULL REFERENCES public.areas(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  party_size INTEGER NOT NULL DEFAULT 1,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'occupied', 'cancelled', 'no_show', 'pending')),
  checked_in_at TIMESTAMPTZ,
  internal_note TEXT,
  cancellation_token UUID DEFAULT gen_random_uuid(),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON public.reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_token ON public.reservations(cancellation_token);

-- =============================================
-- WAITLIST TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id TEXT NOT NULL REFERENCES public.areas(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  party_size INTEGER NOT NULL DEFAULT 1,
  desired_date DATE NOT NULL,
  desired_time TIME NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  promoted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECURRING RESERVATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.recurring_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  area_id TEXT NOT NULL REFERENCES public.areas(id),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  internal_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name TEXT NOT NULL DEFAULT 'Admin',
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);

-- =============================================
-- EMAIL LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('confirmation', 'cancellation', 'waitlist', 'reminder')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  resend_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.table_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  note TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (admin dashboard only)
CREATE POLICY "auth_full_access_settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_areas" ON public.areas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_tables" ON public.tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_reservations" ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_waitlist" ON public.waitlist FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_recurring" ON public.recurring_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_activity" ON public.activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_email_log" ON public.email_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access_table_notes" ON public.table_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous read access to reservations for cancellation token check
CREATE POLICY "anon_read_cancellation" ON public.reservations FOR SELECT TO anon USING (true);
CREATE POLICY "anon_cancel_reservation" ON public.reservations FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
