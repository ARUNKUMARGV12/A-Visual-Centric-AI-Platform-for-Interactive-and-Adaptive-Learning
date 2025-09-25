# Phase 1 Database Schema - User Profiles & Activity Tracking

## Overview
This document defines the database schema for Phase 1 of the Personalized AI Learning Tool, implementing user authentication, profiles, and activity tracking.

## Tables

### 1. user_profiles
Stores comprehensive user profile information and learning preferences.

```sql
CREATE TABLE user_profiles (
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
```

### 2. user_activities
Tracks all user activities for learning analytics and personalization.

```sql
CREATE TABLE user_activities (
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

-- Indexes for efficient querying
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp);
CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_topic ON user_activities(topic);
```

### 3. learning_sessions
Tracks learning sessions for analytics and streak calculation.

```sql
CREATE TABLE learning_sessions (
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

CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_start_time ON learning_sessions(start_time);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- User profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User activities: users can only access their own activities
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning sessions: users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON learning_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

## Functions and Triggers

```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger to create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Sample Data Structures

### User Profile Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "auth-user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "learning_preferences": {
    "style": "visual",
    "pace": "normal",
    "confidence": 0.7,
    "lastUpdated": "2025-01-01T10:00:00Z"
  },
  "goals": [
    {
      "id": 1640995200000,
      "text": "Master Python data structures",
      "created": "2025-01-01T10:00:00Z",
      "completed": false,
      "progress": 45
    }
  ],
  "weak_topics": ["recursion", "dynamic programming"],
  "skill_level": "intermediate",
  "total_interactions": 127,
  "learning_streak": 5,
  "topic_progress": {
    "javascript": {
      "score": 85,
      "attempts": 12,
      "lastStudied": "2025-01-01T09:30:00Z"
    }
  },
  "interaction_types": {
    "chat": 45,
    "games": 23,
    "voice": 12,
    "visualize": 8,
    "quiz": 39
  }
}
```

### Activity Log Example
```json
{
  "id": "activity-uuid",
  "user_id": "auth-user-id",
  "activity_type": "quiz_question_answered",
  "topic": "javascript",
  "details": {
    "question": "What is a closure?",
    "correctAnswer": "A function with access to outer scope",
    "userAnswer": "A function with access to outer scope",
    "isCorrect": true,
    "difficulty": "medium",
    "concepts": ["javascript", "closures"],
    "skills": ["problem-solving", "knowledge-recall"]
  },
  "duration": 2,
  "engagement_score": 0.8,
  "page": "/knowledge-games",
  "session_time": 300000,
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-01-01T10:15:00Z"
  }
}
```

## Setup Instructions

1. **Create the tables** in your Supabase database using the SQL above
2. **Enable RLS policies** for security
3. **Set up triggers** for automatic profile creation
4. **Test the schema** with sample data
5. **Configure your frontend** to use the new structure

## Phase 1 Goals Achieved

✅ **User Authentication**: Supabase Auth integration
✅ **User Profiles**: Comprehensive profile schema with learning preferences
✅ **Activity Tracking**: Detailed logging of all user interactions
✅ **Learning Analytics**: Foundation for behavior analysis and insights
✅ **Data Security**: Row-level security for user data protection
✅ **Scalable Design**: Schema designed for future phases

## Next Phase Integration

This schema provides the foundation for:
- **Phase 2**: Learning behavior analysis and style inference
- **Phase 3**: Contextual memory and RAG personalization
- **Phase 4**: Natural language goal processing
- **Phase 5**: Adaptive UI and recommendations
- **Phase 6**: Feedback loops and advanced insights
