// Create Super Admin User Script
// Run this with: node scripts/create-admin.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// You need the service role key for this (not the anon key)
// Get it from: Supabase Dashboard > Settings > API > service_role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Add this to your .env.local

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  const adminEmail = 'admin@clarix.com';  // Change this to your email
  const adminPassword = 'admin123';       // Change this to a secure password

  try {
    console.log('🔧 Creating super admin user...');

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        first_name: 'Super',
        last_name: 'Admin'
      }
    });

    if (authError && authError.message !== 'User already registered') {
      throw authError;
    }

    let userId;
    if (authData.user) {
      userId = authData.user.id;
      console.log('✅ Auth user created:', adminEmail);
    } else {
      // User might already exist, get their ID
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === adminEmail);
      if (existingUser) {
        userId = existingUser.id;
        console.log('ℹ️  Auth user already exists:', adminEmail);
      } else {
        throw new Error('Failed to create or find user');
      }
    }

    // Step 2: Create/update profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: adminEmail,
        role: 'super_admin',
        first_name: 'Super',
        last_name: 'Admin'
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    console.log('✅ Super admin profile created/updated');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 User ID:', userId);
    console.log('');
    console.log('🎉 Super admin setup complete!');
    console.log('You can now sign in with these credentials.');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
  }
}

createSuperAdmin();
