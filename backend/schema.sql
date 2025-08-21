-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'doctor', 'super_admin')),
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagnoses table
CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    predictions JSONB,
    report JSONB,
    heatmap_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient records table (anonymized)
CREATE TABLE IF NOT EXISTS patient_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    diagnosis_id UUID REFERENCES diagnoses(id) ON DELETE CASCADE NOT NULL,
    patient_id_hash TEXT NOT NULL, -- Anonymized patient identifier
    age_group TEXT CHECK (age_group IN ('child', 'adult', 'elderly')),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR ALL USING (
        auth.uid() = id OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'super_admin'
    );

-- Diagnoses policies
CREATE POLICY "Users can view own diagnoses" ON diagnoses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnoses" ON diagnoses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagnoses" ON diagnoses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all diagnoses" ON diagnoses
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::json->>'role' IN ('doctor', 'super_admin')
    );

-- Patient records policies
CREATE POLICY "Users can view own patient records" ON patient_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all patient records" ON patient_records
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::json->>'role' IN ('doctor', 'super_admin')
    );

-- System logs policies
CREATE POLICY "Super admins can view all logs" ON system_logs
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'super_admin'
    );

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON diagnoses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, username, approved)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NULLIF(NEW.raw_user_meta_data->>'username', ''),
        CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'doctor' THEN FALSE ELSE TRUE END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log system actions
CREATE OR REPLACE FUNCTION log_system_action(
    action_name TEXT,
    action_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_logs (user_id, action, details)
    VALUES (auth.uid(), action_name, action_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_status ON diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_records_diagnosis_id ON patient_records(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Backfill user_id for existing records
UPDATE patient_records
SET user_id = d.user_id
FROM diagnoses d
WHERE patient_records.diagnosis_id = d.id;
