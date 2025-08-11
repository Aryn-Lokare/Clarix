-- Create initial super admin account
-- Run this after setting up the database schema

-- Insert super admin profile
INSERT INTO profiles (id, email, role, first_name, last_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@clarix.com',
  'super_admin',
  'System',
  'Administrator',
  NOW(),
  NOW()
);

-- Note: You'll need to create the actual auth user in Supabase Auth dashboard
-- or use the admin API to create the user with this email and password

