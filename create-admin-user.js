const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// You need to get your SERVICE_ROLE_KEY from Supabase Dashboard
// Go to Settings → API → service_role key (keep this secret!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required!');
  console.log('💡 Add it to your .env.local file:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.log('\n🔑 Find it in: Supabase Dashboard → Settings → API → service_role');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read admin credentials from environment to avoid hardcoding sensitive values
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'change_me_strong_password';

async function createAdminUser() {
  console.log('🚀 Creating admin user with Supabase Admin API...\n');

  try {
    // Step 1: Delete existing users with these emails (cleanup)
    console.log('🧹 Cleaning up existing users...');
    
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const usersToDelete = existingUsers.users.filter(user => 
      user.email === adminEmail || user.email === 'admin@clarix.com'
    );

    for (const user of usersToDelete) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      console.log(`   Deleted user: ${user.email}`);
    }

    // Step 2: Create new admin user
    console.log('\n👤 Creating new admin user...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'super_admin',
        first_name: 'Super',
        last_name: 'Admin'
      }
    });

    if (createError) {
      throw createError;
    }

    console.log('✅ User created successfully!');
    console.log('   ID:', newUser.user.id);
    console.log('   Email:', '[hidden]');
    console.log('   Confirmed:', newUser.user.email_confirmed_at ? 'Yes' : 'No');

    // Step 3: Create profile (using admin client to bypass RLS)
    console.log('\n👑 Creating admin profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email,
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin'
      });

    if (profileError) {
      console.warn('⚠️ Profile creation error:', profileError.message);
      console.log('   User was created but profile might need manual creation');
    } else {
      console.log('✅ Profile created successfully!');
    }

    // Step 4: Test login
    console.log('\n🧪 Testing login...');
    const regularSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: loginData, error: loginError } = await regularSupabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (loginError) {
      throw loginError;
    }

    console.log('✅ Login test successful!');

    // Get profile
    const { data: profile } = await regularSupabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    console.log('\n🎉 ADMIN SETUP COMPLETE!');
    console.log('📧 Email: [hidden]');
    console.log('🔑 Password: [hidden]');
    console.log('👑 Role:', profile?.role || 'Check manually');
    console.log('\n✅ You can now sign in to your app!');

    // Cleanup
    await regularSupabase.auth.signOut();

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('service_role')) {
      console.log('\n💡 Make sure you have SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }
  }
}

createAdminUser();
