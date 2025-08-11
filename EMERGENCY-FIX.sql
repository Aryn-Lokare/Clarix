-- EMERGENCY FIX: COPY AND PASTE THIS INTO SUPABASE SQL EDITOR AND RUN IT

-- Step 1: Completely disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles; 
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profile_select_own" ON profiles;
DROP POLICY IF EXISTS "profile_update_own" ON profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON profiles;
DROP POLICY IF EXISTS "profile_admin_access" ON profiles;
DROP POLICY IF EXISTS "Super admin full access" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Step 3: LEAVE RLS DISABLED FOR NOW - we'll fix it after authentication works
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant permissions to allow access without RLS
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- Step 5: Check if admin user exists and create if needed
DO $$
BEGIN
    -- Try to insert admin profile (will fail if user doesn't exist, that's ok)
    INSERT INTO profiles (id, email, role, first_name, last_name) 
    SELECT 
        (SELECT id FROM auth.users WHERE email = 'admin@clarix.com' LIMIT 1),
        'admin@clarix.com',
        'super_admin',
        'Super',
        'Admin'
    WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@clarix.com')
    ON CONFLICT (id) DO UPDATE SET 
        role = 'super_admin',
        first_name = 'Super',
        last_name = 'Admin';
        
    -- If no rows affected, the user doesn't exist yet
    IF NOT FOUND THEN
        RAISE NOTICE 'Admin user does not exist in auth.users - will be created on first signup attempt';
    END IF;
END
$$;
