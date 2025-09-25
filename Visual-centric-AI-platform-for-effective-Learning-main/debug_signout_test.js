// Test Sign Out Functions
// Paste this in your browser console to test different sign out methods

const testSignOut = async () => {
  console.log('🧪 Testing Sign Out Functions');
  console.log('==========================================');
  
  // Check current state
  console.log('Current auth state:');
  console.log('- localStorage keys:', Object.keys(localStorage));
  console.log('- User agent:', navigator.userAgent);
  
  // Test AuthContext signOut
  try {
    console.log('\n1️⃣ Testing AuthContext signOut...');
    // This would need to be called from within React component
    console.log('❓ This needs to be called from React component');
  } catch (error) {
    console.error('AuthContext signOut error:', error);
  }
  
  // Test direct Supabase signOut
  try {
    console.log('\n2️⃣ Testing direct Supabase signOut...');
    if (window.supabase) {
      const { error } = await window.supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      } else {
        console.log('✅ Supabase signOut successful');
      }
    } else {
      console.log('❌ Supabase client not available on window');
    }
  } catch (error) {
    console.error('Direct Supabase signOut error:', error);
  }
  
  // Test emergency cleanup
  console.log('\n3️⃣ Testing emergency cleanup...');
  const keysToRemove = [
    'userProfile',
    'guestProfile',
    'learningActivities'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`Found ${key} in localStorage`);
    }
  });
  
  // Check for Supabase tokens
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.startsWith('sb-')) {
      console.log(`Found Supabase key: ${key}`);
    }
  });
  
  console.log('\n💡 Manual cleanup commands:');
  console.log('- localStorage.clear()');
  console.log('- sessionStorage.clear()');
  console.log('- window.location.reload()');
};

// Manual cleanup function
const manualCleanup = () => {
  console.log('🧹 Manual cleanup started...');
  
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  console.log('✅ Manual cleanup complete, reloading...');
  setTimeout(() => window.location.reload(), 500);
};

// Make functions available
window.testSignOut = testSignOut;
window.manualCleanup = manualCleanup;

console.log('🛠️ Debug functions loaded:');
console.log('- testSignOut() - Test different sign out methods');
console.log('- manualCleanup() - Force clear everything and reload');
