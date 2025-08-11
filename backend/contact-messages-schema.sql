-- Contact messages table to store form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK (inquiry_type IN ('general', 'sales', 'technical', 'demo', 'integration')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded', 'archived')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert messages (for contact form)
CREATE POLICY "Anyone can submit contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Only super admins can view and manage messages
CREATE POLICY "Super admins can manage contact messages" ON contact_messages
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'admin@clarix.com'
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_inquiry_type ON contact_messages(inquiry_type);

-- Trigger for updated_at
CREATE TRIGGER update_contact_messages_updated_at 
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
