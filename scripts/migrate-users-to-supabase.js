require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { db } = require('../server/db');
const { schema } = require('../shared/schema');
const { users } = schema;
const { eq } = require('drizzle-orm');

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

async function migrateUsers() {
  try {
    // Get all users from our database
    const dbUsers = await db.select().from(users);
    console.log(`Found ${dbUsers.length} users to migrate`);

    // Process each user
    for (const user of dbUsers) {
      try {
        // Skip users that already have a Supabase Auth ID format
        if (user.id && user.id.length > 30) {
          console.log(`User ${user.email} appears to already have a Supabase ID: ${user.id}`);
          continue;
        }

        console.log(`Processing user: ${user.email}`);

        // Check if user already exists in Supabase Auth by email
        const { data: existingUsers, error: getUserError } = await supabase.auth.admin.listUsers();
        
        if (getUserError) {
          console.error(`Error checking if user ${user.email} exists:`, getUserError);
          continue;
        }

        const existingUser = existingUsers.users.find(u => u.email === user.email);
        
        if (existingUser) {
          console.log(`User ${user.email} already exists in Supabase Auth with ID: ${existingUser.id}`);
          
          // Update our database with the Supabase user ID
          const oldId = user.id;
          await db.update(users)
            .set({ id: existingUser.id })
            .where(eq(users.id, oldId));
          
          console.log(`Updated user ${user.email} ID from ${oldId} to ${existingUser.id}`);
          continue;
        }

        // Create user in Supabase Auth
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'TempPassword123!', // Temporary password - should be reset
          email_confirm: true, // Auto-confirm the email
          user_metadata: {
            username: user.username,
            first_name: user.firstName,
            last_name: user.lastName
          }
        });

        if (createError) {
          console.error(`Error creating user ${user.email} in Supabase Auth:`, createError);
          continue;
        }

        console.log(`Created user ${user.email} in Supabase Auth with ID: ${newAuthUser.user.id}`);

        // Update our database with the Supabase user ID
        const oldId = user.id;
        await db.update(users)
          .set({ id: newAuthUser.user.id })
          .where(eq(users.id, oldId));
        
        console.log(`Updated user ${user.email} ID from ${oldId} to ${newAuthUser.user.id}`);

      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
      }
    }

    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateUsers();