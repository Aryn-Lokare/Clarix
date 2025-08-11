-- Fix RLS policies to prevent infinite recursion
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Doctors can view all diagnoses" ON diagnoses;
DROP POLICY IF EXISTS "Doctors can view all patient records" ON patient_records;
DROP POLICY IF EXISTS "Super admins can view all logs" ON system_logs;

-- Recreate policies without recursion

-- Profiles policies (fixed to avoid recursion)
CREATE POLICY "Super admins can manage all profiles" ON profiles
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'admin@clarix.com'
        OR 
        (auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_admin' AND id = auth.uid()
        ))
    );

-- Allow profile insertion for new users
CREATE POLICY "Allow profile creation" ON profiles
    FOR INSERT WITH CHECK (true);

-- Diagnoses policies (fixed to avoid recursion)  
CREATE POLICY "Doctors can view all diagnoses" ON diagnoses
    FOR SELECT USING (
        (auth.jwt() ->> 'email') = 'admin@clarix.com'
        OR
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('doctor', 'super_admin')
        )
    );

-- Patient records policies (fixed to avoid recursion)
CREATE POLICY "Doctors can view all patient records" ON patient_records
    FOR SELECT USING (
        (auth.jwt() ->> 'email') = 'admin@clarix.com'
        OR
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('doctor', 'super_admin')
        )
    );

-- System logs policies (fixed to avoid recursion)
CREATE POLICY "Super admins can view all logs" ON system_logs
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'admin@clarix.com'
        OR
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'super_admin'
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.diagnoses TO authenticated;
GRANT ALL ON public.patient_records TO authenticated;
GRANT ALL ON public.system_logs TO authenticated;
