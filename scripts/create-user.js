import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Read from .env file manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

async function main() {
  // Log the environment variables to debug
  console.log('SUPABASE_URL:', env.SUPABASE_URL);
  console.log('SUPABASE_KEY:', env.SUPABASE_KEY ? 'Found' : 'Not found');

  // Create Supabase client
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_KEY
  );

  console.log('Signing up user in Supabase Auth...');

  // Use regular sign up instead of admin.createUser
  const { data, error } = await supabase.auth.signUp({
    email: 'me@nickybruno.com',
    password: 'password123', // You can change this to a secure password
    options: {
      data: {
        username: 'mtldev',
        first_name: 'Chaya',
        last_name: 'Konopelski'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log('User signed up successfully:', data);
  console.log('User ID:', data.user?.id);
  console.log('Note: This user ID will be different from the database user ID.');
  console.log('You may need to update the database user to match this ID.');
}

main().catch(console.error);