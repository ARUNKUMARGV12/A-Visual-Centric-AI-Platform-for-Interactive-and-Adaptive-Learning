-- Fixed User Profile Schema with user_id column
-- This replaces the existing user_profiles table with all onboarding fields
-- and includes user_id for proper auth integration

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create the comprehensive user_profiles table
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
  learning_style JSONB DEFAULT '[]'::jsonb, -- Array of selected learning styles
  preferred_mode TEXT DEFAULT 'both', -- 'text', 'voice', 'both'
  topics_of_interest JSONB DEFAULT '[]'::jsonb, -- Array of topic IDs
  current_goal TEXT,
  daily_time TEXT DEFAULT '30min',
  
  -- Prior Knowledge
  experience_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  confidence_levels JSONB DEFAULT '{}'::jsonb, -- Object with topic confidence levels
  previous_platforms JSONB DEFAULT '[]'::jsonb, -- Array of platform names
  current_skills JSONB DEFAULT '[]'::jsonb, -- Array of current skills
  interests JSONB DEFAULT '[]'::jsonb, -- Array of interest IDs
  
  -- Intent & Goals
  primary_reason TEXT, -- Main reason for learning
  target_deadline DATE,
  want_reminders BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00',
  motivation TEXT,
  learning_goals JSONB DEFAULT '[]'::jsonb, -- Array of learning goal objects
  time_available TEXT DEFAULT '1-3', -- Hours per week
  
  -- Accessibility & Preferences
  text_size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large'
  visual_mode TEXT DEFAULT 'dark', -- 'light', 'dark', 'dyslexic'
  enable_sound BOOLEAN DEFAULT true,
  
  -- Learning Analytics (from original schema)
  total_interactions INTEGER DEFAULT 0,
  learning_streak INTEGER DEFAULT 0,
  skill_level TEXT DEFAULT 'beginner',
  preferred_difficulty TEXT DEFAULT 'medium',
  last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Learning Preferences (for backward compatibility)
  learning_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Goals and Progress
  goals JSONB DEFAULT '[]'::jsonb, -- Array of goal objects
  progress JSONB DEFAULT '{}'::jsonb, -- Progress tracking object
  achievements JSONB DEFAULT '[]'::jsonb, -- Array of achievement objects
  
  -- Onboarding Status
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT unique_user_email UNIQUE(user_id, email),
  CONSTRAINT valid_experience_level CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT valid_preferred_mode CHECK (preferred_mode IN ('text', 'voice', 'both')),
  CONSTRAINT valid_text_size CHECK (text_size IN ('small', 'medium', 'large')),
  CONSTRAINT valid_visual_mode CHECK (visual_mode IN ('light', 'dark', 'dyslexic'))
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);
CREATE INDEX idx_user_profiles_last_activity ON user_profiles(last_activity_date);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Create trigger to update updated_at timestamp
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

-- Insert default profiles for existing auth users (if any)
INSERT INTO user_profiles (user_id, email, name)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email) as name
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;
