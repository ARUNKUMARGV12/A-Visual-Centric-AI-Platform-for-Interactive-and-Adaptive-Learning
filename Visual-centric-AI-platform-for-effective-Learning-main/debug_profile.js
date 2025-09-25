// Debug User Profile - Paste this in browser console
// This will help us see what's happening with the user profile loading

const debugUserProfile = async () => {
  console.log('🔍 Debug User Profile Loading');
  console.log('==========================================');
  
  // Check if we're authenticated
  const authUser = JSON.parse(localStorage.getItem('sb-qavflynswrcvpijnugvl-auth-token') || '{}');
  console.log('Auth token exists:', !!authUser.access_token);
  
  // Check React state (if available)
  try {
    // This would need to be called from within React
    console.log('React state check needs to be done from component');
  } catch (e) {
    console.log('React state not accessible from console');
  }
  
  // Check direct API call
  const SUPABASE_URL = 'https://qavflynswrcvpijnugvl.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmZseW5zd3JjdnBpam51Z3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzIwOTEsImV4cCI6MjA2MjcwODA5MX0.vkefqsvG0VZSs6QsA_EQfgiBZ9TSEUOO8FHzvi5kuvs';
  
  if (authUser.user?.id) {
    console.log('User ID:', authUser.user.id);
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${authUser.user.id}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${authUser.access_token || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Profile API Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile Data:', data);
        
        if (data.length === 0) {
          console.log('❌ No profile found for this user');
        } else {
          console.log('✅ Profile found:', data[0]);
        }
      } else {
        const error = await response.text();
        console.error('Profile API Error:', error);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  } else {
    console.log('❌ No authenticated user found');
  }
  
  console.log('==========================================');
};

// Manual profile creation test
const createTestProfile = async () => {
  console.log('🔧 Creating test profile...');
  
  const authUser = JSON.parse(localStorage.getItem('sb-qavflynswrcvpijnugvl-auth-token') || '{}');
  
  if (!authUser.user?.id) {
    console.log('❌ No authenticated user');
    return;
  }
  
  const SUPABASE_URL = 'https://qavflynswrcvpijnugvl.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmZseW5zd3JjdnBpam51Z3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzIwOTEsImV4cCI6MjA2MjcwODA5MX0.vkefqsvG0VZSs6QsA_EQfgiBZ9TSEUOO8FHzvi5kuvs';
  
  const profileData = {
    user_id: authUser.user.id,
    name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User',
    email: authUser.user.email,
    skill_level: 'beginner',
    total_interactions: 0,
    learning_streak: 0
  };
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authUser.access_token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(profileData)
      }
    );
    
    console.log('Create Profile Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Profile created:', data);
      location.reload(); // Refresh to see changes
    } else {
      const error = await response.text();
      console.error('❌ Profile creation failed:', error);
    }
  } catch (error) {
    console.error('Profile creation error:', error);
  }
};

// Make functions available
window.debugUserProfile = debugUserProfile;
window.createTestProfile = createTestProfile;

console.log('🛠️ Profile debug functions loaded:');
console.log('- debugUserProfile() - Check profile loading status');
console.log('- createTestProfile() - Manually create profile if missing');
