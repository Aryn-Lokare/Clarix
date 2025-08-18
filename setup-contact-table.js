const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupContactTable() {
  console.log('🚀 Setting up contact_messages table...')
  
  try {
    // Check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('contact_messages')
      .select('id')
      .limit(1)
    
    if (checkError && checkError.code === '42P01') {
      console.log('📋 Table does not exist, creating...')
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
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
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
          CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
          CREATE INDEX IF NOT EXISTS idx_contact_messages_inquiry_type ON contact_messages(inquiry_type);
          
          -- Enable RLS
          ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Anyone can insert contact messages" ON contact_messages
            FOR INSERT WITH CHECK (true);
            
          CREATE POLICY "Super admins can view all contact messages" ON contact_messages
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'super_admin'
              )
            );
            
          CREATE POLICY "Super admins can update contact messages" ON contact_messages
            FOR UPDATE USING (
              EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'super_admin'
              )
            );
        `
      })
      
      if (createError) {
        console.error('❌ Failed to create table via RPC:', createError)
        console.log('💡 Trying alternative method...')
        
        // Try to create table directly
        const { error: directError } = await supabase
          .from('contact_messages')
          .select('*')
        
        if (directError) {
          console.error('❌ Direct table creation failed:', directError)
          console.log('\n📝 Please run this SQL manually in your Supabase SQL Editor:')
          console.log(`
-- Copy and paste this into your Supabase SQL Editor:

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_inquiry_type ON contact_messages(inquiry_type);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Super admins can view all contact messages" ON contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );
  
CREATE POLICY "Super admins can update contact messages" ON contact_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );
          `)
          return
        }
      }
      
      console.log('✅ Table created successfully!')
    } else {
      console.log('✅ Table already exists')
    }
    
    // Test inserting a sample message
    console.log('🧪 Testing table functionality...')
    const { data: testData, error: testError } = await supabase
      .from('contact_messages')
      .insert({
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message to verify the table works.',
        inquiry_type: 'general'
      })
      .select()
    
    if (testError) {
      console.error('❌ Test insert failed:', testError)
    } else {
      console.log('✅ Test message inserted successfully')
      
      // Clean up test message
      await supabase
        .from('contact_messages')
        .delete()
        .eq('email', 'test@example.com')
      
      console.log('🧹 Test message cleaned up')
    }
    
    console.log('\n🎉 Contact messages table setup complete!')
    console.log('📱 You can now use the contact form and view messages in the admin panel.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.log('\n💡 Please check your Supabase configuration and try again.')
  }
}

setupContactTable()

