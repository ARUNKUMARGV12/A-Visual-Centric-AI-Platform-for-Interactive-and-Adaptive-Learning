#!/usr/bin/env python3
"""
Debug script to test Supabase authentication and user creation
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_KEY')  # Backend uses SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def test_supabase_connection():
    """Test basic Supabase connection"""
    print("🔍 Testing Supabase connection...")
    print(f"SUPABASE_URL: {SUPABASE_URL}")
    print(f"SUPABASE_ANON_KEY: {SUPABASE_ANON_KEY[:20]}...")
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("❌ Missing Supabase credentials")
        return False
    
    # Test REST API health
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            }
        )
        print(f"✅ REST API Status: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ REST API Error: {e}")
        return False

def check_auth_settings():
    """Check authentication settings"""
    print("\n🔍 Checking authentication settings...")
    
    if not SUPABASE_SERVICE_ROLE_KEY:
        print("⚠️ No service role key found - limited auth debugging")
        return
    
    try:
        # Check auth settings
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/settings",
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
            }
        )
        
        if response.status_code == 200:
            settings = response.json()
            print(f"✅ Auth Settings Retrieved")
            print(f"   - Site URL: {settings.get('site_url', 'Not set')}")
            print(f"   - Email Confirmation: {settings.get('email_confirm', 'Unknown')}")
            print(f"   - Phone Confirmation: {settings.get('phone_confirm', 'Unknown')}")
        else:
            print(f"❌ Auth Settings Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Auth Settings Check Error: {e}")

def test_signup_directly():
    """Test direct signup via Supabase Auth API"""
    print("\n🔍 Testing direct signup...")
    
    test_email = "debug_test@example.com"
    test_password = "TestPassword123!"
    
    try:
        response = requests.post(
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
                    "name": "Debug Test User"
                }
            }
        )
        
        print(f"Signup Response Status: {response.status_code}")
        print(f"Signup Response Headers: {dict(response.headers)}")
        print(f"Signup Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Signup successful!")
        else:
            print(f"❌ Signup failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Signup Test Error: {e}")

def check_user_profiles_table():
    """Check if user_profiles table exists and is accessible"""
    print("\n🔍 Checking user_profiles table...")
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_profiles?select=count",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Prefer": "count=exact"
            }
        )
        
        print(f"user_profiles table check: {response.status_code}")
        if response.status_code == 200:
            print("✅ user_profiles table accessible")
        else:
            print(f"❌ user_profiles table error: {response.text}")
            
    except Exception as e:
        print(f"❌ Table Check Error: {e}")

def main():
    print("🚀 Supabase Debug Script")
    print("=" * 50)
    
    # Test basic connection
    if not test_supabase_connection():
        return
    
    # Check auth settings
    check_auth_settings()
    
    # Check tables
    check_user_profiles_table()
    
    # Test signup
    test_signup_directly()
    
    print("\n" + "=" * 50)
    print("🏁 Debug complete")

if __name__ == "__main__":
    main()
