// Test script to verify Supabase connection
// Run with: node test-connection.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.log('Please create .env.local with your Supabase credentials')
    return
  }
  
  console.log('✅ Environment variables found')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.log('Make sure you have run the schema.sql in Supabase')
    } else {
      console.log('✅ Database connection successful')
    }
    
    // Test storage connection
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Storage connection failed:', bucketError.message)
    } else {
      console.log('✅ Storage connection successful')
      console.log('Available buckets:', buckets.map(b => b.name))
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
  }
}

testConnection()
