-- Complete admin cleanup and recreation
-- Run this in your Supabase SQL Editor

-- Step 1: Clean up any existing admin records
-- Replace placeholder with actual email before running
DELETE FROM profiles WHERE email IN ('admin@clarix.com', '<REPLACE_WITH_ADMIN_EMAIL>');
DELETE FROM auth.users WHERE email IN ('admin@clarix.com', '<REPLACE_WITH_ADMIN_EMAIL>');

-- Step 2: Create new admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  '<REPLACE_WITH_ADMIN_EMAIL>',
  crypt('admin123', gen_salt('bf')),  -- Password: admin123
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "super_admin"}'
);

-- Step 3: Get the created user ID and create profile
WITH new_user AS (
  SELECT id, email FROM auth.users WHERE email = '<REPLACE_WITH_ADMIN_EMAIL>'
)
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Super',
  'Admin',
  'super_admin',
  NOW(),
  NOW()
FROM new_user;

-- Step 4: Verify the creation
SELECT 
  'SUCCESS: Admin user created' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.first_name,
  p.last_name
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = '<REPLACE_WITH_ADMIN_EMAIL>';
