import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Must use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function cleanSupabaseUsers() {
  try {
    // Get all users from Supabase
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return;
    }
    
    console.log(`Found ${data.users.length} users in Supabase Auth`);
    
    // Delete each user
    for (const user of data.users) {
      try {
        console.log(`Deleting user: ${user.email} (${user.id})`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${user.email}:`, deleteError);
        } else {
          console.log(`Successfully deleted user ${user.email}`);
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }
    
    console.log('Cleanup completed!');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanSupabaseUsers();