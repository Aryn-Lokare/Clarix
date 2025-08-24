# Fix for Database Schema and Authentication Errors

## Problem Summary
You're experiencing two main issues:
1. **PGRST204 Error**: Database schema mismatch - `image_name` column not found
2. **Authentication Error**: Invalid refresh token issues

## ✅ SOLUTION STEPS

### Step 1: Fix Database Schema Issue

**Option A: Run the SQL Fix (Recommended)**
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste this SQL code:

```sql
-- Fix schema alignment issue
ALTER TABLE diagnoses RENAME COLUMN image_path TO image_name;

-- Verify the fix worked
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'diagnoses' 
ORDER BY ordinal_position;
```

**Option B: Update Frontend Code (Alternative)**
If you prefer to change the frontend instead, update line 180 in `app/dashboard/page.jsx`:

```javascript
// Change this:
image_name: selectedFile.name,

// To this:
image_path: selectedFile.name,
```

### Step 2: Test the Database Fix

Try inserting a test record to verify the schema is fixed:

```sql
-- Test insert (replace the UUID with an actual user ID from your auth.users table)
INSERT INTO diagnoses (user_id, image_name, status, predictions) 
VALUES (
  'your-user-id-here',
  'test-image.png',
  'completed',
  '{"test": "data"}'::jsonb
);
```

### Step 3: Address Authentication Issues

The authentication fix has already been applied to your `dashboard/page.jsx` file. The changes include:

1. **Better Session Handling**: Added proper refresh token logic
2. **Error Recovery**: Graceful handling of session errors
3. **User Feedback**: Clear error messages for authentication failures

### Step 4: Clear Browser Data (Important!)

To resolve persistent authentication issues:

1. **Clear Browser Cache**: 
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear all data for the last 24 hours

2. **Clear Local Storage**:
   - Open Developer Tools (F12)
   - Go to Application tab
   - Clear Local Storage and Session Storage for your app

3. **Sign Out and Back In**:
   - Use the sign out button in your app
   - Sign back in with your credentials

### Step 5: Verify Both Fixes Work

1. **Test Authentication**:
   - Sign in to your application
   - Navigate to the dashboard
   - Ensure no authentication errors appear

2. **Test File Upload**:
   - Select a medical image file
   - Click "Analyze with AI"
   - Verify the diagnosis saves without the PGRST204 error

## 🔧 Alternative Solutions

### If the SQL Fix Doesn't Work:

1. **Check Current Schema**:
```sql
\d+ diagnoses  -- Shows table structure
```

2. **Recreate Table** (Nuclear Option):
```sql
-- BACKUP YOUR DATA FIRST!
CREATE TABLE diagnoses_backup AS SELECT * FROM diagnoses;

-- Drop and recreate with correct schema
DROP TABLE diagnoses CASCADE;

-- Use the create-diagnoses-table.sql script
```

### If Authentication Still Fails:

1. **Check Supabase Keys**: Verify your Supabase URL and anon key in `lib/supabase.js`
2. **Reset User Session**: Delete the user from Supabase Auth and re-register
3. **Check RLS Policies**: Ensure Row Level Security policies allow the operations

## 🚨 Emergency Fallback

If nothing works, you can temporarily disable RLS:

```sql
-- TEMPORARY FIX - NOT FOR PRODUCTION!
ALTER TABLE diagnoses DISABLE ROW LEVEL SECURITY;
GRANT ALL ON diagnoses TO authenticated;
GRANT ALL ON diagnoses TO anon;
```

Remember to re-enable RLS once the core issues are resolved!

## ✅ Verification Checklist

- [ ] Database schema has `image_name` column (or frontend uses `image_path`)
- [ ] No PGRST204 errors when saving diagnoses
- [ ] Authentication works without refresh token errors  
- [ ] File uploads complete successfully
- [ ] User can view their saved diagnoses

## 📞 Still Having Issues?

If you're still experiencing problems:

1. **Check the browser console** for detailed error messages
2. **Check Supabase logs** in your dashboard for server-side errors
3. **Verify your backend API** at `http://localhost:8000` is running
4. **Test with a simple API call** first before complex file uploads

The fixes provided should resolve both the database schema mismatch and the authentication refresh token issues.
