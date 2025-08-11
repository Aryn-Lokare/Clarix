const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This should be the service role key, not anon key
);

async function fixDatabase() {
  console.log('🔧 Fixing database policies...');
  
  try {
    // First, let's try to create the super admin profile
    const { data: existingSuperAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@clarix.com')
      .single();

    if (!existingSuperAdmin) {
      // Create super admin user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@clarix.com',
        password: 'admin123',
        email_confirm: true
      });

      if (authError && authError.message !== 'User already registered') {
        console.error('❌ Error creating super admin user:', authError);
        return;
      }

      if (authData.user) {
        // Create super admin profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: 'admin@clarix.com',
            role: 'super_admin',
            first_name: 'Super',
            last_name: 'Admin'
          });

        if (profileError) {
          console.error('❌ Error creating super admin profile:', profileError);
        } else {
          console.log('✅ Super admin profile created');
        }
      }
    } else {
      console.log('✅ Super admin profile already exists');
    }

    console.log('✅ Database fix completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to your Supabase Dashboard SQL Editor');
    console.log('2. Run the contents of backend/fix-rls-policies.sql');
    console.log('3. Try signing in again');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  }
}

fixDatabase();
