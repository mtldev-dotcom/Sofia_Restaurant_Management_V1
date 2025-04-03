import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if required environment variables are set
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and key must be provided in environment variables');
  process.exit(1);
}

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);