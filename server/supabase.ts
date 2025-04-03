import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Check if environment variables are defined
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

// Create Supabase server client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Utility function to get a user from a JWT token
 */
export async function getUser(token: string) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}