-- SCHEMA ALIGNMENT FIX
-- Run this in your Supabase SQL editor to fix the column name mismatch

-- Option 1: Rename image_path to image_name to match the frontend code
-- This is the safest option if your current table uses image_path
ALTER TABLE diagnoses RENAME COLUMN image_path TO image_name;

-- Add the column if it doesn't exist (in case the table was created with the older schema)
-- This will fail if the column already exists, which is fine
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE diagnoses ADD COLUMN image_name TEXT NOT NULL DEFAULT '';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column image_name already exists';
    END;
END $$;

-- If you had image_path and just added image_name, copy the data
-- UPDATE diagnoses SET image_name = image_path WHERE image_name = '' OR image_name IS NULL;

-- Remove image_path if it exists and you've copied data to image_name
-- ALTER TABLE diagnoses DROP COLUMN IF EXISTS image_path;

-- Ensure the table structure matches what the frontend expects
-- The frontend (saveDiagnosis function) expects these columns:
-- - id (UUID, primary key)
-- - user_id (UUID, references auth.users)
-- - image_name (TEXT, not null)
-- - predictions (JSONB)
-- - status (TEXT, with check constraint)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'diagnoses' 
ORDER BY ordinal_position;
