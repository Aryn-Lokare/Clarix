-- Create diagnoses table for storing AI analysis results
CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    predictions JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses(created_at);

-- Enable RLS
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own diagnoses
CREATE POLICY "Users can view own diagnoses" ON diagnoses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own diagnoses
CREATE POLICY "Users can insert own diagnoses" ON diagnoses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own diagnoses
CREATE POLICY "Users can update own diagnoses" ON diagnoses
    FOR UPDATE USING (auth.uid() = user_id);

-- Super admins can view all diagnoses
CREATE POLICY "Super admins can view all diagnoses" ON diagnoses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Super admins can update all diagnoses
CREATE POLICY "Super admins can update all diagnoses" ON diagnoses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_diagnoses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_diagnoses_updated_at
    BEFORE UPDATE ON diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_diagnoses_updated_at();
