-- =============================================
-- Rondo Admin Dashboard – Full Schema
-- =============================================

-- AREAS
CREATE TABLE IF NOT EXISTS public.areas (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0
);

-- TABLES
CREATE TABLE IF NOT EXISTS public.tables (
  id            TEXT PRIMARY KEY,
  number        TEXT NOT NULL,
  area_id       TEXT NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  capacity      INT NOT NULL DEFAULT 4,
  status        TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free','reserved','occupied','blocked')),
  blocked_reason TEXT,
  pos_x         FLOAT NOT NULL DEFAULT 0,
  pos_y         FLOAT NOT NULL DEFAULT 0,
  width         FLOAT NOT NULL DEFAULT 80,
  height        FLOAT NOT NULL DEFAULT 80,
  table_type    TEXT NOT NULL DEFAULT 'restaurant' CHECK (table_type IN ('restaurant','billiard'))
);

-- RESERVATIONS
CREATE TABLE IF NOT EXISTS public.reservations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  guest_name         TEXT NOT NULL,
  guest_email        TEXT,
  guest_phone        TEXT,
  area_id            TEXT NOT NULL REFERENCES public.areas(id),
  table_id           TEXT NOT NULL REFERENCES public.tables(id),
  reservation_date   DATE NOT NULL,
  start_time         TIME NOT NULL,
  end_time           TIME NOT NULL,
  persons            INT NOT NULL DEFAULT 2,
  status             TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','occupied','cancelled','completed','waitlist')),
  staff_notes        TEXT,
  checked_in_at      TIMESTAMPTZ,
  recurring_id       UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WAITLIST
CREATE TABLE IF NOT EXISTS public.waitlist (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name    TEXT NOT NULL,
  guest_email   TEXT,
  guest_phone   TEXT,
  area_id       TEXT NOT NULL REFERENCES public.areas(id),
  desired_date  DATE NOT NULL,
  desired_time  TIME NOT NULL,
  persons       INT NOT NULL DEFAULT 2,
  notes         TEXT,
  notified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RECURRING RESERVATIONS
CREATE TABLE IF NOT EXISTS public.recurring_reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name    TEXT NOT NULL,
  guest_email   TEXT,
  guest_phone   TEXT,
  area_id       TEXT NOT NULL REFERENCES public.areas(id),
  table_id      TEXT NOT NULL REFERENCES public.tables(id),
  weekday       INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  persons       INT NOT NULL DEFAULT 2,
  frequency     TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly','biweekly')),
  start_date    DATE NOT NULL,
  end_date      DATE,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  staff_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name     TEXT NOT NULL DEFAULT 'Admin',
  action         TEXT NOT NULL,
  details        TEXT,
  reservation_id UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EMAIL LOG
CREATE TABLE IF NOT EXISTS public.email_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name     TEXT,
  guest_email    TEXT NOT NULL,
  email_type     TEXT NOT NULL CHECK (email_type IN ('confirmation','cancellation','waitlist','reminder')),
  reservation_id UUID,
  status         TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE NOTES
CREATE TABLE IF NOT EXISTS public.table_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id   TEXT NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  note       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(table_id)
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
  id                    TEXT PRIMARY KEY DEFAULT 'main',
  opening_hours         JSONB NOT NULL DEFAULT '{}',
  booking_rules         JSONB NOT NULL DEFAULT '{}',
  notification_settings JSONB NOT NULL DEFAULT '{}',
  email_sender          JSONB NOT NULL DEFAULT '{}',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','manager','staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SEED DATA
-- =============================================

-- Areas
INSERT INTO public.areas (id, name, enabled, sort_order) VALUES
  ('billard',     'Billard Tisch',           TRUE, 1),
  ('salitos',     'Salitos Lounge / Outdoor', TRUE, 2),
  ('rest140',     'Restaurant 140 Zoll',     TRUE, 3),
  ('rest75',      'Restaurant 75 Zoll',      TRUE, 4),
  ('vip',         'VIP Raum / Sport',        TRUE, 5)
ON CONFLICT (id) DO NOTHING;

-- Tables – Billard Tisch (Area 1)
INSERT INTO public.tables (id, number, area_id, capacity, status, pos_x, pos_y, width, height, table_type) VALUES
  ('b1',  'B1',  'billard', 2, 'free', 80,  80,  140, 70, 'billiard'),
  ('b2',  'B2',  'billard', 2, 'free', 260, 80,  140, 70, 'billiard'),
  ('b3',  'B3',  'billard', 2, 'free', 440, 80,  140, 70, 'billiard'),
  ('b4',  'B4',  'billard', 2, 'free', 620, 80,  140, 70, 'billiard'),
  ('b5',  'B5',  'billard', 2, 'free', 80,  220, 140, 70, 'billiard'),
  ('b6',  'B6',  'billard', 2, 'free', 260, 220, 140, 70, 'billiard'),
  ('b7',  'B7',  'billard', 2, 'free', 440, 220, 140, 70, 'billiard'),
  ('b8',  'B8',  'billard', 2, 'free', 620, 220, 140, 70, 'billiard'),
  ('bt10','10',  'billard', 4, 'free', 140, 360, 80,  80, 'restaurant'),
  ('bt30','30',  'billard', 4, 'free', 340, 360, 80,  80, 'restaurant')
ON CONFLICT (id) DO NOTHING;

-- Tables – Salitos Lounge (Area 2)
INSERT INTO public.tables (id, number, area_id, capacity, status, pos_x, pos_y, width, height, table_type) VALUES
  ('s1', 'S1', 'salitos', 4, 'free', 80,  80,  90, 90, 'restaurant'),
  ('s2', 'S2', 'salitos', 4, 'free', 250, 80,  90, 90, 'restaurant'),
  ('s3', 'S3', 'salitos', 6, 'free', 420, 80,  120, 90, 'restaurant'),
  ('s4', 'S4', 'salitos', 4, 'free', 80,  240, 90, 90, 'restaurant'),
  ('s5', 'S5', 'salitos', 4, 'free', 250, 240, 90, 90, 'restaurant'),
  ('s6', 'S6', 'salitos', 6, 'free', 420, 240, 120, 90, 'restaurant')
ON CONFLICT (id) DO NOTHING;

-- Tables – Restaurant 140 Zoll (Area 3)
INSERT INTO public.tables (id, number, area_id, capacity, status, pos_x, pos_y, width, height, table_type) VALUES
  ('r140_50', '50', 'rest140', 4,  'free', 80,  80,  100, 80, 'restaurant'),
  ('r140_51', '51', 'rest140', 4,  'free', 230, 80,  100, 80, 'restaurant'),
  ('r140_52', '52', 'rest140', 4,  'free', 380, 80,  100, 80, 'restaurant'),
  ('r140_53', '53', 'rest140', 6,  'free', 530, 80,  140, 80, 'restaurant'),
  ('r140_54', '54', 'rest140', 6,  'free', 80,  230, 140, 80, 'restaurant'),
  ('r140_58', '58', 'rest140', 8,  'free', 280, 230, 160, 80, 'restaurant'),
  ('r140_59', '59', 'rest140', 8,  'free', 500, 230, 160, 80, 'restaurant'),
  ('r140_60', '60', 'rest140', 10, 'free', 80,  380, 200, 80, 'restaurant'),
  ('r140_66', '66', 'rest140', 10, 'free', 340, 380, 200, 80, 'restaurant'),
  ('r140_67', '67', 'rest140', 6,  'free', 600, 380, 120, 80, 'restaurant')
ON CONFLICT (id) DO NOTHING;

-- Tables – Restaurant 75 Zoll (Area 4)
INSERT INTO public.tables (id, number, area_id, capacity, status, pos_x, pos_y, width, height, table_type) VALUES
  ('r75_101', '101', 'rest75', 4, 'free',     100, 80,  90, 80, 'restaurant'),
  ('r75_102', '102', 'rest75', 4, 'reserved', 260, 80,  90, 80, 'restaurant'),
  ('r75_103', '103', 'rest75', 4, 'occupied', 420, 80,  90, 80, 'restaurant'),
  ('r75_104', '104', 'rest75', 4, 'free',     100, 230, 90, 80, 'restaurant'),
  ('r75_105', '105', 'rest75', 6, 'free',     260, 230, 120, 80, 'restaurant'),
  ('r75_106', '106', 'rest75', 6, 'free',     420, 230, 120, 80, 'restaurant')
ON CONFLICT (id) DO NOTHING;

-- Tables – VIP Raum (Area 5)
INSERT INTO public.tables (id, number, area_id, capacity, status, pos_x, pos_y, width, height, table_type) VALUES
  ('vip_101', '101', 'vip', 4, 'free', 100, 80,  90, 80, 'restaurant'),
  ('vip_102', '102', 'vip', 4, 'free', 260, 80,  90, 80, 'restaurant'),
  ('vip_103', '103', 'vip', 4, 'free', 420, 80,  90, 80, 'restaurant'),
  ('vip_104', '104', 'vip', 4, 'free', 100, 230, 90, 80, 'restaurant'),
  ('vip_105', '105', 'vip', 6, 'free', 260, 230, 120, 80, 'restaurant'),
  ('vip_106', '106', 'vip', 6, 'free', 420, 230, 120, 80, 'restaurant')
ON CONFLICT (id) DO NOTHING;

-- Default Settings
INSERT INTO public.settings (id, opening_hours, booking_rules, notification_settings, email_sender) VALUES (
  'main',
  '{"monday":{"open":"17:00","close":"02:00","enabled":true},"tuesday":{"open":"17:00","close":"02:00","enabled":true},"wednesday":{"open":"17:00","close":"02:00","enabled":true},"thursday":{"open":"17:00","close":"02:00","enabled":true},"friday":{"open":"15:00","close":"03:00","enabled":true},"saturday":{"open":"15:00","close":"03:00","enabled":true},"sunday":{"open":"15:00","close":"00:00","enabled":true}}',
  '{"min_lead_minutes":60,"max_duration_minutes":180,"default_duration_minutes":120}',
  '{"admin_email_alerts":true,"manager_email":""}',
  '{"name":"Rondo Sportsbar","address":"onboarding@resend.dev"}'
) ON CONFLICT (id) DO NOTHING;

-- Seed demo reservations for today
INSERT INTO public.reservations (guest_name, guest_email, guest_phone, area_id, table_id, reservation_date, start_time, end_time, persons, status, staff_notes) VALUES
  ('Schmidt, M.',  'max@example.com', '+49151000001', 'rest75',  'r75_102', CURRENT_DATE, '18:00', '20:00', 3, 'confirmed', NULL),
  ('Devis',        'devis@example.com',NULL,          'rest75',  'r75_103', CURRENT_DATE, '17:30', '19:30', 2, 'occupied',  NULL),
  ('Wagner, K.',   'kwag@example.com', '+49151000003', 'rest140', 'r140_58', CURRENT_DATE, '19:00', '21:00', 6, 'confirmed', NULL),
  ('Müller, T.',   'tmuller@example.com',NULL,         'rest140', 'r140_60', CURRENT_DATE, '20:00', '22:30', 8, 'confirmed', 'Geburtstag'),
  ('Ivanova, A.',  'anna@example.com',  NULL,          'vip',     'vip_102', CURRENT_DATE, '21:00', '23:00', 4, 'confirmed', 'VIP Event'),
  ('Becker, R.',   'rbecker@example.com','+49151000006','billard','b3',      CURRENT_DATE, '17:00', '19:00', 2, 'confirmed', NULL),
  ('Chen, L.',     'lchen@example.com', NULL,          'salitos', 's3',      CURRENT_DATE, '20:30', '22:30', 5, 'confirmed', NULL)
ON CONFLICT DO NOTHING;

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
