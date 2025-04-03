import { createClient } from '@supabase/supabase-js';

// Check if environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env file.');
}

// Create Supabase client with persistent sessions
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Enable session persistence
    autoRefreshToken: true, // Automatically refresh tokens
    storageKey: 'supabase_auth', // Local storage key for session
    detectSessionInUrl: true, // Detect session in URL (for OAuth)
  }
});

// Types for user profile
export type UserSession = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
export type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];