-- Simple fix for RLS policies to allow authentication to work
-- Run this in your Supabase SQL Editor

-- First, temporarily disable RLS on profiles to allow profile creation
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Re-enable RLS 
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow super admin access (using email check to avoid recursion)
CREATE POLICY "Super admin full access" ON profiles
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'admin@clarix.com'
    );

-- Create super admin user if it doesn't exist
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@clarix.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create super admin profile
INSERT INTO profiles (id, email, role, first_name, last_name)
SELECT id, email, 'super_admin', 'Super', 'Admin'
FROM auth.users 
WHERE email = 'admin@clarix.com'
ON CONFLICT (id) DO NOTHING;
