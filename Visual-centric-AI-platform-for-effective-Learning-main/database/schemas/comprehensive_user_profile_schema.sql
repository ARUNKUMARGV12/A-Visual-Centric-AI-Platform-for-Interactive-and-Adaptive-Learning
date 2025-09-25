-- Comprehensive User Profile Schema for Supabase
-- This replaces the existing user_profiles table with all onboarding fields

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create the comprehensive user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  last_activity_date TIMESTAMP WITH TIME ZONE,
  
  -- Learning Preferences (from original schema) 
  learning_preferences JSONB DEFAULT '{
    "style": "visual",
    "pace": "normal",
    "confidence": 0.5,
    "mode": "both",
    "textSize": "medium",
    "visualMode": "dark",
    "enableSound": true
  }'::jsonb,
  
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

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_user_profiles_last_activity ON user_profiles(last_activity_date);

-- Create GIN indexes for JSONB fields for efficient querying
CREATE INDEX idx_user_profiles_learning_style ON user_profiles USING GIN (learning_style);
CREATE INDEX idx_user_profiles_topics ON user_profiles USING GIN (topics_of_interest);
CREATE INDEX idx_user_profiles_skills ON user_profiles USING GIN (current_skills);
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN (interests);
CREATE INDEX idx_user_profiles_metadata ON user_profiles USING GIN (metadata);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see and modify their own profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.email() = email);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.email() = email);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.email() = email);

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Insert some example data structure (commented out)
/*
INSERT INTO user_profiles (
  email, name, age, education_level, learning_style, topics_of_interest,
  experience_level, onboarding_completed, onboarding_completed_at
) VALUES (
  'example@test.com',
  'John Doe',
  25,
  'undergraduate-3',
  '["visual", "kinesthetic"]',
  '["dsa", "web", "aiml"]',
  'intermediate',
  true,
  NOW()
);
*/
