const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'change_me_strong_password';

async function testAdminLogin() {
  console.log('🧪 Testing admin login...\n');

  try {
    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      console.log('\n💡 Solutions:');
      console.log('1. Go to Supabase Dashboard → Authentication → Users');
      console.log('2. Find admin@clarix.com user');
      console.log('3. Click the three dots (⋮) and select "Confirm User"');
      console.log('4. Try logging in again');
      return;
    }

    console.log('✅ Login successful!');
    console.log('   User:', '[hidden]');
    console.log('   User ID:', loginData.user.id);
    
    // Check the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
    } else {
      console.log('✅ Profile found:');
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
      console.log('   Name:', profile.first_name, profile.last_name);
      
      if (profile.role === 'super_admin') {
        console.log('\n🎉 SUPER ADMIN SETUP COMPLETE!');
        console.log('📧 Email: [hidden]');
        console.log('🔑 Password: [hidden]');
        console.log('👑 Role: super_admin');
        console.log('\n✅ You can now sign in to the admin panel!');
      } else {
        console.log('\n⚠️  User exists but role is not super_admin');
      }
    }

    // Sign out to clean up
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAdminLogin();
