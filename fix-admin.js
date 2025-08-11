const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixAdmin() {
  console.log('🔧 Fixing admin user...');

  try {
    // Update the existing profile to super_admin role
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'super_admin',
        first_name: 'Super',
        last_name: 'Admin'
      })
      .eq('id', '44259bda-09fc-4876-8807-0c1d048db31c')
      .select();

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
    } else {
      console.log('✅ Profile updated to super_admin:', updateData);
    }

    console.log('\n📧 Since email confirmation is required, we need to use a different approach...');
    console.log('Let\'s create the admin user directly in Supabase Dashboard instead.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAdmin();
