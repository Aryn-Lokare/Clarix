-- EMERGENCY SCHEMA FIX - RUN THIS IN SUPABASE SQL EDITOR IMMEDIATELY
-- This will fix the PGRST204 error about image_name column

-- Step 1: Check what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'diagnoses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add image_name column if it doesn't exist
DO $$ 
BEGIN
    -- Try to add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'diagnoses' 
        AND column_name = 'image_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.diagnoses ADD COLUMN image_name TEXT;
        RAISE NOTICE 'Added image_name column';
    ELSE
        RAISE NOTICE 'image_name column already exists';
    END IF;
END $$;

-- Step 3: If image_path exists, copy its data to image_name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'diagnoses' 
        AND column_name = 'image_path'
        AND table_schema = 'public'
    ) THEN
        -- Copy data from image_path to image_name
        UPDATE public.diagnoses 
        SET image_name = image_path 
        WHERE image_name IS NULL AND image_path IS NOT NULL;
        
        RAISE NOTICE 'Copied data from image_path to image_name';
    END IF;
END $$;

-- Step 4: Make image_name NOT NULL if it has data
DO $$
BEGIN
    -- Only make it NOT NULL if we have data
    IF EXISTS (SELECT 1 FROM public.diagnoses WHERE image_name IS NOT NULL LIMIT 1) THEN
        -- Fill any remaining NULL values with empty string
        UPDATE public.diagnoses SET image_name = '' WHERE image_name IS NULL;
        
        -- Make the column NOT NULL
        ALTER TABLE public.diagnoses ALTER COLUMN image_name SET NOT NULL;
        
        RAISE NOTICE 'Made image_name column NOT NULL';
    ELSE
        -- Set a default value for new records
        ALTER TABLE public.diagnoses ALTER COLUMN image_name SET DEFAULT '';
        RAISE NOTICE 'Set default value for image_name column';
    END IF;
END $$;

-- Step 5: Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'diagnoses' AND table_schema = 'public'
ORDER BY ordinal_position;
