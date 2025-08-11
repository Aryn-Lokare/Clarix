-- Create Super Admin User
-- Run this in your Supabase SQL Editor

-- First, ensure the profiles table exists and RLS is properly configured
-- (This should already be done if you ran the previous schema)

-- Method 1: Create super admin profile manually (if user already exists in auth)
-- Replace placeholder with your actual email/password before running
DO $$
DECLARE
    admin_email TEXT := '<REPLACE_WITH_ADMIN_EMAIL>';  -- Change this to your email
    admin_password TEXT := '<REPLACE_WITH_STRONG_PASSWORD>';       -- Change this to a secure password
    admin_user_id UUID;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        -- Create new user ID
        admin_user_id := gen_random_uuid();
        
        -- Insert user into auth.users (this creates the authentication record)
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            aud,
            role,
            raw_user_meta_data,
            raw_app_meta_data
        ) VALUES (
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            'authenticated',
            'authenticated',
            jsonb_build_object('role', 'super_admin'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email'])
        );
        
        RAISE NOTICE 'Created new super admin user: %', admin_email;
    ELSE
        RAISE NOTICE 'Super admin user already exists: %', admin_email;
    END IF;
    
    -- Insert or update profile
    INSERT INTO public.profiles (
        id,
        email,
        role,
        first_name,
        last_name,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        admin_email,
        'super_admin',
        'Super',
        'Admin',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'super_admin',
        updated_at = NOW();
        
    RAISE NOTICE 'Super admin profile created/updated successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating super admin: %', SQLERRM;
END $$;
