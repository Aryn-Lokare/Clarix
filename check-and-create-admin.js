const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAndCreateAdmin() {
  console.log('🔍 Checking existing users and profiles...\n');

  try {
    // Check existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log('📊 Existing profiles:');
      if (profiles.length === 0) {
        console.log('   No profiles found');
      } else {
        profiles.forEach(profile => {
          console.log(`   - ${profile.email} (${profile.role}) - ID: ${profile.id}`);
        });
      }
    }

    console.log('\n🔧 Let\'s create the super admin user...');
    
    // First, try to sign up the admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@clarix.com',
      password: 'admin123',
      options: {
        data: {
          role: 'super_admin',
          first_name: 'Super',
          last_name: 'Admin'
        }
      }
    });

    if (signUpError) {
      console.log('⚠️  SignUp error (might already exist):', signUpError.message);
    } else if (signUpData.user) {
      console.log('✅ User created successfully!');
      console.log('   User ID:', signUpData.user.id);
      console.log('   Email:', signUpData.user.email);
      
      // Create the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          email: 'admin@clarix.com',
          role: 'super_admin',
          first_name: 'Super',
          last_name: 'Admin'
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
      } else {
        console.log('✅ Profile created successfully!');
      }
    }

    console.log('\n🎯 Testing login...');
    
    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@clarix.com',
      password: 'admin123'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('   User:', loginData.user.email);
      console.log('   Session exists:', !!loginData.session);
      
      // Check the profile
      const { data: profile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profileCheckError) {
        console.error('❌ Profile check error:', profileCheckError);
      } else {
        console.log('✅ Profile found:', profile);
        console.log('\n🎉 Super admin setup is complete!');
        console.log('📧 Email: admin@clarix.com');
        console.log('🔑 Password: admin123');
        console.log('👑 Role:', profile.role);
      }
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

checkAndCreateAdmin();
