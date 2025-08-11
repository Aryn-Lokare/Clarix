-- Update admin email to desired value and confirm it
-- Run this in your Supabase SQL Editor

-- First, update the auth.users table
UPDATE auth.users 
SET 
  email = '<REPLACE_WITH_ADMIN_EMAIL>',
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@clarix.com';

-- Update the profiles table to match
UPDATE profiles 
SET 
  email = '<REPLACE_WITH_ADMIN_EMAIL>',
  updated_at = NOW()
WHERE email = 'admin@clarix.com';

-- Verify the updates
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  confirmed_at
FROM auth.users 
WHERE email = '<REPLACE_WITH_ADMIN_EMAIL>'

UNION ALL

SELECT 
  'profiles' as table_name,
  id,
  email,
  created_at as email_confirmed_at,
  updated_at as confirmed_at
FROM profiles 
WHERE email = '<REPLACE_WITH_ADMIN_EMAIL>';
