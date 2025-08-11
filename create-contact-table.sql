-- Create contact_messages table if it doesn't exist
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    inquiry_type VARCHAR(50) DEFAULT 'general',
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES auth.users(id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_inquiry_type ON contact_messages(inquiry_type);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
    FOR INSERT 
    WITH CHECK (true);

-- Create policy for super admins to read all messages
CREATE POLICY "Super admins can view all contact messages" ON contact_messages
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Create policy for super admins to update messages (mark as responded, etc.)
CREATE POLICY "Super admins can update contact messages" ON contact_messages
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Verify the table was created
SELECT 'Table created successfully!' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contact_messages' 
ORDER BY ordinal_position;
