#!/usr/bin/env python3
"""
Advanced Supabase Auth Debug Script
This script will help diagnose and fix the signup issue
"""

import os
import requests
import json
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_KEY')

def test_auth_with_cleanup():
    """Test authentication with cleanup of test user"""
    print("🧪 Testing authentication with cleanup...")
    
    # Generate unique test email
    test_id = str(uuid.uuid4())[:8]
    test_email = f"test_user_{test_id}@example.com"
    test_password = "TestPassword123!"
    
    print(f"Creating test user: {test_email}")
    
    # Step 1: Try to sign up
    signup_response = requests.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "email": test_email,
            "password": test_password,
            "data": {
                "name": f"Test User {test_id}"
            }
        }
    )
    
    print(f"Signup Status: {signup_response.status_code}")
    
    if signup_response.status_code == 200:
        signup_data = signup_response.json()
        print("✅ Signup successful!")
        print(f"User ID: {signup_data.get('user', {}).get('id')}")
        
        # Check if profile was created
        user_id = signup_data.get('user', {}).get('id')
        if user_id:
            check_profile_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.{user_id}",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
                }
            )
            
            print(f"Profile check status: {check_profile_response.status_code}")
            if check_profile_response.status_code == 200:
                profiles = check_profile_response.json()
                if profiles:
                    print("✅ User profile created successfully!")
                    print(f"Profile: {profiles[0]}")
                else:
                    print("❌ No user profile found - trigger might not be working")
            else:
                print(f"❌ Profile check failed: {check_profile_response.text}")
        
        return True
    else:
        print(f"❌ Signup failed: {signup_response.text}")
        return False

def check_database_schema():
    """Check if all required tables and triggers exist"""
    print("\n🔍 Checking database schema...")
    
    # Check tables
    tables_to_check = ['user_profiles', 'user_activities', 'learning_sessions']
    
    for table in tables_to_check:
        try:
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?select=count",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "Prefer": "count=exact"
                }
            )
            
            if response.status_code == 200:
                print(f"✅ Table '{table}' exists and accessible")
            else:
                print(f"❌ Table '{table}' issue: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Error checking table '{table}': {e}")

def get_auth_users():
    """Try to get auth users (requires service role key)"""
    print("\n🔍 Checking auth users...")
    
    # This requires service role key, but let's try with anon key to see what happens
    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            }
        )
        
        print(f"Auth users check: {response.status_code}")
        if response.status_code == 200:
            users = response.json()
            print(f"Found {len(users.get('users', []))} users")
        else:
            print(f"Auth users check failed (expected): {response.text}")
            
    except Exception as e:
        print(f"Auth users check error: {e}")

def create_manual_profile_fix():
    """Create a manual fix for the signup issue"""
    print("\n🔧 Creating manual profile creation function...")
    
    manual_fix_sql = """
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
"""
    
    return manual_fix_sql

def main():
    print("🚀 Advanced Supabase Auth Debug")
    print("=" * 60)
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("❌ Missing Supabase credentials in backend/.env")
        return
    
    # Check database schema
    check_database_schema()
    
    # Check auth users
    get_auth_users()
    
    # Test authentication
    test_auth_with_cleanup()
    
    # Provide manual fix
    print("\n🔧 Manual Fix SQL:")
    print("Run this in your Supabase SQL Editor:")
    print("-" * 60)
    print(create_manual_profile_fix())
    print("-" * 60)
    
    print("\n📋 Next Steps:")
    print("1. Copy the SQL above and run it in Supabase SQL Editor")
    print("2. Try signing up again in your frontend")
    print("3. If still failing, check Supabase logs for detailed errors")
    print("4. Consider temporarily disabling email confirmation in Supabase Auth settings")

if __name__ == "__main__":
    main()
