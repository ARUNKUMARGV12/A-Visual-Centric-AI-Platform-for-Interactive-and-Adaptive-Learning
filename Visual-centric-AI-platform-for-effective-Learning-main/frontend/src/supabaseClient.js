import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_KEY;

let supabaseInstance = null;
let initializationError = null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase credentials are missing in supabaseClient.js. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your .env file.');
  initializationError = 'Failed to initialize Supabase: Missing credentials.';
} else {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully in supabaseClient.js:', supabaseInstance);
  } catch (error) {
    console.error('Failed to initialize Supabase client in supabaseClient.js:', error.message);
    initializationError = 'Failed to initialize Supabase in supabaseClient.js: ' + error.message;
    supabaseInstance = null; // Ensure it's null on error
  }
}

export const supabase = supabaseInstance;
export const supabaseInitializationError = initializationError; 