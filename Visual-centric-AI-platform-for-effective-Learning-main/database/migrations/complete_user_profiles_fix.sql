-- COMPLETE FIX: Schema + Permissive RLS Policies
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop and recreate the table with proper schema
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create the comprehensive user_profiles table with user_id
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Basic Information
  name TEXT,
  age INTEGER,
  education_level TEXT,
  occupation TEXT,
  preferred_language TEXT DEFAULT 'English',
  
  -- Learning Preferences
  learning_style JSONB DEFAULT '[]'::jsonb,
  preferred_mode TEXT DEFAULT 'both',
  topics_of_interest JSONB DEFAULT '[]'::jsonb,
  current_goal TEXT,
  daily_time TEXT DEFAULT '30min',
  
  -- Prior Knowledge
  experience_level TEXT DEFAULT 'beginner',
  confidence_levels JSONB DEFAULT '{}'::jsonb,
  previous_platforms JSONB DEFAULT '[]'::jsonb,
  current_skills JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  
  -- Intent & Goals
  primary_reason TEXT,
  target_deadline DATE,
  want_reminders BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00',
  motivation TEXT,
  learning_goals JSONB DEFAULT '[]'::jsonb,
  time_available TEXT DEFAULT '1-3',
  
  -- Accessibility & Preferences
  text_size TEXT DEFAULT 'medium',
  visual_mode TEXT DEFAULT 'dark',
  enable_sound BOOLEAN DEFAULT true,
  
  -- Learning Analytics
  total_interactions INTEGER DEFAULT 0,
  learning_streak INTEGER DEFAULT 0,
  skill_level TEXT DEFAULT 'beginner',
  preferred_difficulty TEXT DEFAULT 'medium',
  last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Learning Preferences (for backward compatibility)
  learning_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Goals and Progress
  goals JSONB DEFAULT '[]'::jsonb,
  progress JSONB DEFAULT '{}'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  
  -- Onboarding Status
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 2: Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Step 3: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant permissions to service role
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Step 5: Create VERY PERMISSIVE policies for debugging
-- These allow ALL operations for testing purposes

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Allow backend inserts" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create permissive policies for debugging
CREATE POLICY "Debug: Allow all access" ON user_profiles
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Explicit service role access
GRANT ALL PRIVILEGES ON user_profiles TO service_role;

-- Step 6: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Test the table by inserting a dummy record (will be cleaned up)
INSERT INTO user_profiles (user_id, email, name, onboarding_completed) 
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'test@example.com', 
    'Test User', 
    true
) ON CONFLICT (email) DO NOTHING;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Clean up test record
DELETE FROM user_profiles WHERE email = 'test@example.com';
