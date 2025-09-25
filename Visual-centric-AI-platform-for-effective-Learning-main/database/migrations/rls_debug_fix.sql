-- Quick fix for RLS issues - Run this in Supabase SQL Editor
-- This temporarily allows service role to insert data regardless of RLS

-- First, let's check if RLS is the issue by temporarily allowing service role inserts
CREATE POLICY "Allow service role full access" ON user_profiles
    FOR ALL USING (true)
    WITH CHECK (true);

-- Grant explicit permissions to service role  
GRANT ALL PRIVILEGES ON user_profiles TO service_role;

-- Also create a policy for unauthenticated inserts (for testing)
CREATE POLICY "Allow backend inserts" ON user_profiles
    FOR INSERT 
    WITH CHECK (true);

-- Update the existing policies to be more permissive during testing
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create more permissive policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (true); -- Temporarily allow all

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (true); -- Temporarily allow all

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (true); -- Temporarily allow all
