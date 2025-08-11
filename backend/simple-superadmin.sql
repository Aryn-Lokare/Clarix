-- Simple Super Admin Creation
-- Run this AFTER you create a user manually in Supabase Dashboard

-- Step 1: Go to Supabase Dashboard > Authentication > Users
-- Step 2: Click "Add User" and create user with:
--         Email: admin@clarix.com (or your email)
--         Password: admin123 (or your password)
--         Email Confirm: checked
-- Step 3: Note the User ID from the created user
-- Step 4: Run this SQL with the correct User ID:

-- Replace 'USER_ID_HERE' with the actual UUID from the user you just created
INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    created_at,
    updated_at
) VALUES (
    'USER_ID_HERE'::uuid,  -- Replace with actual user ID
    'admin@clarix.com',    -- Replace with your email
    'super_admin',
    'Super',
    'Admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    updated_at = NOW();

-- Verify the super admin was created
SELECT * FROM profiles WHERE role = 'super_admin';
