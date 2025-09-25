#!/usr/bin/env python3
"""
Test script to verify the signup fix works
"""

import os
import requests
import json
from dotenv import load_dotenv
import uuid
import time

load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_KEY')

def test_full_signup_flow():
    """Test the complete signup and profile creation flow"""
    print("🧪 Testing Complete Signup Flow")
    print("=" * 50)
    
    # Generate unique test user
    test_id = str(uuid.uuid4())[:8]
    test_email = f"test.user.{test_id}@example.com"  # More valid email format
    test_password = "TestPassword123!"
    
    print(f"Testing with: {test_email}")
    
    # Step 1: Signup
    print("\n1️⃣ Testing Signup...")
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
        user_id = signup_data.get('user', {}).get('id')
        print(f"✅ Signup successful! User ID: {user_id}")
        
        # Step 2: Wait and check profile creation
        print("\n2️⃣ Checking Profile Creation...")
        time.sleep(2)  # Wait for trigger
        
        profile_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.{user_id}",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            }
        )
        
        if profile_response.status_code == 200:
            profiles = profile_response.json()
            if profiles:
                print(f"✅ Profile created! Name: {profiles[0].get('name')}")
                return True
            else:
                print("❌ No profile found")
        else:
            print(f"❌ Profile check failed: {profile_response.text}")
            
    else:
        print(f"❌ Signup failed: {signup_response.text}")
    
    return False

def check_trigger_status():
    """Check if trigger exists"""
    print("\n🔍 Checking Database Trigger Status...")
    
    # This would require service role access, so we'll just test the signup
    print("Note: Direct trigger check requires service role key")
    print("We'll test by attempting signup instead")

def main():
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("❌ Missing Supabase credentials")
        return
    
    print("🚀 Supabase Signup Fix Verification")
    print("This will test if the signup issue has been resolved\n")
    
    # Test signup flow
    success = test_full_signup_flow()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 SUCCESS! Signup and profile creation working!")
        print("\n✅ Next steps:")
        print("1. Test signup in your frontend application")
        print("2. Verify onboarding flow works")
        print("3. Test activity logging for authenticated users")
    else:
        print("❌ Signup still failing. Try these steps:")
        print("1. Run the SQL trigger fix in Supabase SQL Editor")
        print("2. Disable email confirmation in Supabase Auth settings")
        print("3. Check Supabase logs for detailed error messages")
        print("4. The frontend now has fallback profile creation")

if __name__ == "__main__":
    main()
