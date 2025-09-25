-- Enhanced User Profile Schema
-- Add these columns to the existing user_profiles table

-- Add new columns for detailed profile information
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS current_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS time_available TEXT,
ADD COLUMN IF NOT EXISTS motivation TEXT;

-- Update the learning_preferences structure to include more details
-- Note: Since learning_preferences is already JSONB, we can store additional fields

-- Create an index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_user_profiles_name ON user_profiles(name);

-- Create an index on skills for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_skills ON user_profiles USING GIN(current_skills);

-- Create an index on interests for recommendations
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests ON user_profiles USING GIN(interests);

-- Create an index on education for analytics
CREATE INDEX IF NOT EXISTS idx_user_profiles_education ON user_profiles(education);

-- Update the trigger function to handle the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    name, 
    email,
    learning_preferences,
    goals,
    weak_topics,
    skill_level,
    total_interactions,
    learning_streak,
    preferred_difficulty,
    time_spent_learning,
    interaction_types,
    topic_progress,
    achievements,
    onboarding_completed,
    age,
    education,
    occupation,
    current_skills,
    interests,
    time_available,
    motivation
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    '{"style": "unknown", "pace": "normal", "confidence": 0.0, "lastUpdated": null}',
    '[]',
    '{}',
    'beginner',
    0,
    0,
    'medium',
    0,
    '{"chat": 0, "games": 0, "voice": 0, "visualize": 0, "quiz": 0}',
    '{}',
    '{}',
    false,
    NULL,
    '',
    '',
    '{}',
    '{}',
    '',
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example query to update existing profiles with enhanced structure
-- Run this if you have existing users without the detailed fields
UPDATE user_profiles 
SET 
  age = NULL,
  education = '',
  occupation = '',
  current_skills = '{}',
  interests = '{}',
  time_available = '',
  motivation = ''
WHERE age IS NULL;

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
