-- Seed test admin user for Rondo dashboard
-- Email: hanibam00@gmail.com
-- Password: admin

-- Note: In production, use proper password hashing via your auth provider
-- This script creates a test user record. The actual authentication
-- is handled by Supabase Auth service, which you must configure
-- via the Supabase dashboard to create the user with proper hashing.

-- To properly seed this user:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add user" 
-- 4. Email: hanibam00@gmail.com
-- 5. Password: admin
-- 6. Auto Confirm User: Toggle ON
-- 7. Save

-- After creating the user in Supabase Auth, you can verify
-- the user was created by checking the auth.users table

-- Optional: Create an admin_users table if needed for additional admin tracking
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access admin_users
CREATE POLICY "authenticated_read_admin_users" ON public.admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_write_admin_users" ON public.admin_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- After user creation in Supabase Auth, uncomment this line and run separately:
-- INSERT INTO public.admin_users (email, full_name, role) VALUES ('hanibam00@gmail.com', 'Admin User', 'admin') ON CONFLICT (email) DO NOTHING;
