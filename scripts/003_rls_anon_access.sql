-- Fix RLS: allow anon (unauthenticated) full access since auth is removed from admin dashboard

-- Settings
DROP POLICY IF EXISTS "auth_full_access_settings" ON public.settings;
CREATE POLICY "public_full_access_settings" ON public.settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Areas
DROP POLICY IF EXISTS "auth_full_access_areas" ON public.areas;
CREATE POLICY "public_full_access_areas" ON public.areas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Tables
DROP POLICY IF EXISTS "auth_full_access_tables" ON public.tables;
CREATE POLICY "public_full_access_tables" ON public.tables FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Reservations
DROP POLICY IF EXISTS "auth_full_access_reservations" ON public.reservations;
DROP POLICY IF EXISTS "anon_read_cancellation" ON public.reservations;
DROP POLICY IF EXISTS "anon_cancel_reservation" ON public.reservations;
CREATE POLICY "public_full_access_reservations" ON public.reservations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Waitlist
DROP POLICY IF EXISTS "auth_full_access_waitlist" ON public.waitlist;
CREATE POLICY "public_full_access_waitlist" ON public.waitlist FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Recurring
DROP POLICY IF EXISTS "auth_full_access_recurring" ON public.recurring_reservations;
CREATE POLICY "public_full_access_recurring" ON public.recurring_reservations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Activity log
DROP POLICY IF EXISTS "auth_full_access_activity" ON public.activity_log;
CREATE POLICY "public_full_access_activity" ON public.activity_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Email log
DROP POLICY IF EXISTS "auth_full_access_email_log" ON public.email_log;
CREATE POLICY "public_full_access_email_log" ON public.email_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Table notes
DROP POLICY IF EXISTS "auth_full_access_table_notes" ON public.table_notes;
CREATE POLICY "public_full_access_table_notes" ON public.table_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
