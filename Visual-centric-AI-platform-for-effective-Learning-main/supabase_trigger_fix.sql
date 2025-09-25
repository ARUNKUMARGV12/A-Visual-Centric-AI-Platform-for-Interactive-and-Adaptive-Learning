-- Advanced Trigger Fix for Supabase User Profile Creation
-- Run this in your Supabase SQL Editor

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    profile_name TEXT;
BEGIN
    -- Extract name from metadata or use email prefix
    profile_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Insert user profile with error handling
    BEGIN
        INSERT INTO user_profiles (user_id, name, email, created_at, updated_at)
        VALUES (
            NEW.id,
            profile_name,
            NEW.email,
            NOW(),
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE NOTICE 'Error creating user profile for %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
