import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseError, getCurrentUser, getCurrentSession, createUserProfile, getUserProfile } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // If Supabase is not available, just set loading to false
        if (!supabase) {
          console.warn('Supabase not configured - Auth disabled, guest mode only');
          setLoading(false);
          return;
        }
        
        const currentSession = await getCurrentSession();
        const currentUser = await getCurrentUser();
        
        setSession(currentSession);
        setUser(currentUser);
        
        if (currentUser) {
          await loadUserProfile(currentUser.email || currentUser.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes only if Supabase is available
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.email || session.user.id);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  // Helper function to parse JSON fields
  const parseJsonField = (value, defaultValue) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn('Failed to parse JSON field:', value);
        return defaultValue;
      }
    }
    return value || defaultValue;
  };

  // Load user profile
  const loadUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await getUserProfile(userId);
      
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create a default one
        const defaultProfile = createDefaultProfile();
        const { data: newProfile, error: createError } = await createUserProfile(userId, defaultProfile);
        
        if (createError) {
          console.error('Error creating user profile:', createError);
        } else {
          setUserProfile(newProfile[0]);
        }
      } else if (error) {
        console.error('Error loading user profile:', error);
      } else {
        // Parse JSON fields that might be stored as strings in the database
        const parsedProfile = {
          ...profile,
          topics_of_interest: parseJsonField(profile.topics_of_interest, []),
          learning_goals: parseJsonField(profile.learning_goals, []),
          current_skills: parseJsonField(profile.current_skills, []),
          learning_style: parseJsonField(profile.learning_style, []),
          confidence_levels: parseJsonField(profile.confidence_levels, {}),
          learning_preferences: parseJsonField(profile.learning_preferences, {}),
          interests: parseJsonField(profile.interests, []),
          goals: parseJsonField(profile.goals, [])
        };
        
        console.log('Loaded and parsed profile:', parsedProfile);
        setUserProfile(parsedProfile);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  // Create default profile structure
  const createDefaultProfile = () => {
    return {
      name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student',
      email: user?.email || '',
      learning_preferences: {
        style: 'unknown',
        pace: 'normal',
        confidence: 0.0
      },
      goals: [],
      weak_topics: [],
      skill_level: 'beginner',
      total_interactions: 0,
      learning_streak: 0,
      preferred_difficulty: 'medium',
      interaction_types: {
        chat: 0,
        games: 0,
        voice: 0,
        visualize: 0,
        quiz: 0
      },
      topic_progress: {},
      time_spent_learning: 0,
      achievements: [],
      onboarding_completed: false
    };
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) {
        console.error('Error updating profile:', error);
        return { error };
      } else {
        setUserProfile(data.user_metadata);
        return { data: data.user_metadata };
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { error };
    }
  };

  // Update user profile using backend API
  const updateUserProfile = async (updateData) => {
    if (!user?.email) {
      throw new Error('No user email available');
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          updateData: updateData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const result = await response.json();
      
      // Manually update the local userProfile state with the new data
      setUserProfile(prevProfile => ({
        ...prevProfile,
        ...updateData
      }));
      
      console.log('Profile updated successfully, local state updated');
      
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Sign up function with manual profile creation fallback
  const signUp = async (email, password, userData = {}) => {
    try {
      console.log('🔄 Starting signup process...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || email.split('@')[0]
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        return { data, error };
      }
      
      return { data, error };
    } catch (error) {
      console.error('Signup process error:', error);
      return { error };
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  // Sign out function - improved with better error handling
  const signOut = async () => {
    try {
      console.log('🚪 Starting sign out process...');
      
      // Clear Supabase session if available
      if (supabase) {
        console.log('📡 Signing out from Supabase...');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('Supabase signOut error:', error);
          // Continue with local cleanup even if Supabase fails
        } else {
          console.log('✅ Supabase sign out successful');
        }
      }
      
      // Always clear local state (works for both real users and guests)
      console.log('🧹 Clearing local state...');
      setUser(null);
      setUserProfile(null);
      setSession(null);
      
      // Clear any local storage data - be more thorough
      const storageKeys = [
        'userProfile',
        'guestProfile',
        'learningActivities',
        'supabase.auth.token'
      ];
      
      storageKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear all Supabase auth tokens
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
          console.log(`Removed storage key: ${key}`);
        }
      });
      
      console.log('✅ Successfully signed out');
      
      // Force a page refresh to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return { error: null };
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setUserProfile(null);
      setSession(null);
      
      // Force refresh as fallback
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return { error };
    }
  };

  // Guest mode for demo purposes
  const continueAsGuest = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      email: 'guest@demo.com',
      isGuest: true
    };
    
    const guestProfile = {
      ...createDefaultProfile(),
      name: 'Guest User',
      email: 'guest@demo.com',
      isGuest: true
    };
    
    setUser(guestUser);
    setUserProfile(guestProfile);
    setLoading(false);
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateUserProfile,
    continueAsGuest,
    isAuthenticated: !!user,
    isGuest: user?.isGuest || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
