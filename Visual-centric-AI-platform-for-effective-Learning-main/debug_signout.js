// Debug Sign Out Function
// Add this to your browser console to force sign out

const debugSignOut = async () => {
  console.log('🔍 Debug Sign Out Started');
  
  // Check current auth state
  console.log('Current localStorage keys:', Object.keys(localStorage));
  console.log('Current sessionStorage keys:', Object.keys(sessionStorage));
  
  // Clear all auth-related storage
  const keysToRemove = [
    'userProfile',
    'guestProfile', 
    'learningActivities',
    'supabase.auth.token',
    'sb-qavflynswrcvpijnugvl-auth-token'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  });
  
  // Clear all localStorage items starting with 'sb-'
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
      console.log(`Removed Supabase key: ${key}`);
    }
  });
  
  console.log('✅ Storage cleared, refreshing page...');
  window.location.reload();
};

// Export for console use
window.debugSignOut = debugSignOut;

console.log('💡 Debug function available: call debugSignOut() in console to force sign out');
