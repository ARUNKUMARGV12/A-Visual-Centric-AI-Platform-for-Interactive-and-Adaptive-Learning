-- Phase 1 Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Learning Preferences
  learning_preferences JSONB DEFAULT '{
    "style": "unknown",
    "pace": "normal",
    "confidence": 0.0,
    "lastUpdated": null
  }',
  
  -- User Goals
  goals JSONB DEFAULT '[]',
  
  -- Areas for improvement
  weak_topics TEXT[] DEFAULT '{}',
  
  -- User metrics
  skill_level TEXT DEFAULT 'beginner',
  total_interactions INTEGER DEFAULT 0,
  learning_streak INTEGER DEFAULT 0,
  preferred_difficulty TEXT DEFAULT 'medium',
  time_spent_learning INTEGER DEFAULT 0, -- in minutes
  
  -- Interaction tracking
  interaction_types JSONB DEFAULT '{
    "chat": 0,
    "games": 0,
    "voice": 0,
    "visualize": 0,
    "quiz": 0
  }',
  
  -- Topic progress
  topic_progress JSONB DEFAULT '{}',
  
  -- Achievements
  achievements TEXT[] DEFAULT '{}',
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 2. Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'page_visit', 'chat_query', 'game_activity', etc.
  topic TEXT, -- main topic/subject
  details JSONB DEFAULT '{}', -- activity-specific data
  
  -- Engagement metrics
  duration INTEGER DEFAULT 1, -- duration in minutes
  engagement_score REAL DEFAULT 0.5, -- 0.0 to 1.0
  
  -- Context
  page TEXT, -- which page/section
  session_time INTEGER, -- time since session start (ms)
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 3. Create learning_sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Session metrics
  activities_count INTEGER DEFAULT 0,
  topics_covered TEXT[] DEFAULT '{}',
  engagement_average REAL DEFAULT 0.0,
  
  -- Session data
  session_data JSONB DEFAULT '{}',
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_topic ON user_activities(topic);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_start_time ON learning_sessions(start_time);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- User profiles: users can only access their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User activities: users can only access their own activities
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON user_activities;
CREATE POLICY "Users can insert own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning sessions: users can only access their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON learning_sessions;
CREATE POLICY "Users can view own sessions" ON learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON learning_sessions;
CREATE POLICY "Users can insert own sessions" ON learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON learning_sessions;
CREATE POLICY "Users can update own sessions" ON learning_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create Functions and Triggers

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user profile
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

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Finished! Your database is now set up for Phase 1 testing.
