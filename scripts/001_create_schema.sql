-- ─── Areas ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ─── Tables ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tables (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number         TEXT NOT NULL,
  area_id        UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  capacity       INTEGER NOT NULL DEFAULT 4,
  status         TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free','reserved','occupied','blocked')),
  blocked_reason TEXT,
  pos_x          NUMERIC NOT NULL DEFAULT 0,
  pos_y          NUMERIC NOT NULL DEFAULT 0,
  width          NUMERIC NOT NULL DEFAULT 80,
  height         NUMERIC NOT NULL DEFAULT 60,
  table_type     TEXT NOT NULL DEFAULT 'restaurant' CHECK (table_type IN ('restaurant','billiard'))
);

-- ─── Reservations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reservations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  guest_name         TEXT NOT NULL,
  guest_email        TEXT,
  guest_phone        TEXT,
  area_id            UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
  table_id           UUID NOT NULL REFERENCES public.tables(id) ON DELETE RESTRICT,
  reservation_date   DATE NOT NULL,
  start_time         TIME NOT NULL,
  end_time           TIME NOT NULL,
  party_size         INTEGER NOT NULL DEFAULT 1,
  status             TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','occupied','cancelled','completed','waitlist')),
  internal_note      TEXT,
  checked_in_at      TIMESTAMPTZ,
  recurring_id       UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Waitlist ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name   TEXT NOT NULL,
  guest_email  TEXT,
  guest_phone  TEXT,
  area_id      UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
  desired_date DATE NOT NULL,
  desired_time TIME NOT NULL,
  party_size   INTEGER NOT NULL DEFAULT 1,
  notified     BOOLEAN NOT NULL DEFAULT false,
  promoted     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Recurring Reservations ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recurring_reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name    TEXT NOT NULL,
  guest_email   TEXT,
  guest_phone   TEXT,
  area_id       UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
  table_id      UUID NOT NULL REFERENCES public.tables(id) ON DELETE RESTRICT,
  weekday       INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  party_size    INTEGER NOT NULL DEFAULT 1,
  start_date    DATE NOT NULL,
  end_date      DATE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  internal_note TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Activity Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name     TEXT NOT NULL DEFAULT 'System',
  action         TEXT NOT NULL,
  details        TEXT,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Email Log ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name     TEXT,
  guest_email    TEXT NOT NULL,
  email_type     TEXT NOT NULL CHECK (email_type IN ('confirmation','cancellation','waitlist','reminder')),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Table Notes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.table_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id   UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  note       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Floor Objects (room plan editor) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.floor_objects (
  id         TEXT PRIMARY KEY,
  area_id    UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Settings (key/value store) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Seed default settings ────────────────────────────────────────────────────
INSERT INTO public.settings (key, value) VALUES
  ('opening_hours', '{
    "monday":    {"open":"14:00","close":"02:00","enabled":true},
    "tuesday":   {"open":"14:00","close":"02:00","enabled":true},
    "wednesday": {"open":"14:00","close":"02:00","enabled":true},
    "thursday":  {"open":"14:00","close":"02:00","enabled":true},
    "friday":    {"open":"14:00","close":"03:00","enabled":true},
    "saturday":  {"open":"12:00","close":"03:00","enabled":true},
    "sunday":    {"open":"12:00","close":"02:00","enabled":true}
  }'::jsonb),
  ('booking_rules', '{
    "min_lead_minutes":30,
    "max_duration_minutes":180,
    "default_duration_minutes":120
  }'::jsonb),
  ('notifications', '{
    "admin_email_alerts":true,
    "manager_email":"manager@rondo-sportsbar.de"
  }'::jsonb),
  ('email_sender', '{
    "name":"Rondo Sportsbar",
    "address":"onboarding@resend.dev"
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ─── Seed default areas ───────────────────────────────────────────────────────
INSERT INTO public.areas (name, enabled, sort_order) VALUES
  ('Billard Tisch', true, 1),
  ('Salitos Lounge / Outdoor', true, 2),
  ('Restaurant 140 Zoll', true, 3),
  ('Restaurant 75 Zoll / Sport', true, 4),
  ('VIP Raum / Sport', true, 5)
ON CONFLICT DO NOTHING;
