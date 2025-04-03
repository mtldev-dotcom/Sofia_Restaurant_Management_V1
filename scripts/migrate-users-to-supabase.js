import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { db } from '../server/db.js';
import { users, restaurantUsers, restaurants } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import fs from 'fs';

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

// Function to generate a random password
function generateSecurePassword() {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+';
  
  // Generate 12 random characters
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  for (let i = 0; i < 3; i++) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

async function getRestaurantAssociations(userId) {
  try {
    // Get all restaurant associations for this user
    const associations = await db.select({
      restaurantId: restaurantUsers.restaurantId,
      role: restaurantUsers.role,
      restaurantName: restaurants.name
    })
    .from(restaurantUsers)
    .leftJoin(restaurants, eq(restaurantUsers.restaurantId, restaurants.id))
    .where(eq(restaurantUsers.userId, userId));
    
    return associations;
  } catch (error) {
    console.error(`Error getting restaurant associations for user ${userId}:`, error);
    return [];
  }
}

async function migrateRestaurantAssociations(oldUserId, newUserId) {
  try {
    // Get all restaurant associations for the old user ID
    const associations = await getRestaurantAssociations(oldUserId);
    
    if (associations.length === 0) {
      console.log(`No restaurant associations found for user ${oldUserId}`);
      return;
    }
    
    console.log(`Found ${associations.length} restaurant associations for user ${oldUserId}`);
    
    for (const assoc of associations) {
      try {
        // Check if association already exists for new user ID
        const existingAssoc = await db.select()
          .from(restaurantUsers)
          .where(
            and(
              eq(restaurantUsers.userId, newUserId),
              eq(restaurantUsers.restaurantId, assoc.restaurantId)
            )
          );
        
        if (existingAssoc.length > 0) {
          console.log(`Association already exists between user ${newUserId} and restaurant ${assoc.restaurantId}`);
          continue;
        }
        
        // Create new association with the new user ID
        await db.insert(restaurantUsers)
          .values({
            userId: newUserId,
            restaurantId: assoc.restaurantId,
            role: assoc.role
          });
        
        console.log(`Created association between user ${newUserId} and restaurant ${assoc.restaurantId} (${assoc.restaurantName}) with role ${assoc.role}`);
        
        // Delete the old association
        await db.delete(restaurantUsers)
          .where(
            and(
              eq(restaurantUsers.userId, oldUserId),
              eq(restaurantUsers.restaurantId, assoc.restaurantId)
            )
          );
        
        console.log(`Deleted old association between user ${oldUserId} and restaurant ${assoc.restaurantId}`);
      } catch (assocError) {
        console.error(`Error migrating restaurant association for user ${oldUserId} to ${newUserId}:`, assocError);
      }
    }
  } catch (error) {
    console.error(`Error migrating restaurant associations for user ${oldUserId}:`, error);
  }
}

async function migrateUsers() {
  // Initialize CSV files for reporting
  const migrationLog = fs.createWriteStream('migration_results.csv');
  migrationLog.write('Email,OldID,NewID,Status,Password,Notes\n');
  
  try {
    // Get all users from our database
    const dbUsers = await db.select().from(users);
    console.log(`Found ${dbUsers.length} users to migrate`);

    let successCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const user of dbUsers) {
      try {
        // Skip users that already have a Supabase Auth ID format (UUID)
        if (user.id && user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.log(`User ${user.email} appears to already have a Supabase ID: ${user.id}`);
          migrationLog.write(`${user.email},${user.id},${user.id},SKIPPED,,Already has Supabase ID\n`);
          continue;
        }

        console.log(`\nProcessing user: ${user.email} (${user.id})`);
        
        // Generate a secure random password for this user
        // This is safer than using the same password for all users
        const securePassword = generateSecurePassword();
        
        // Check if user already exists in Supabase Auth by email
        const { data: { users: existingUsers }, error: getUserError } = await supabase.auth.admin.listUsers();
        
        if (getUserError) {
          console.error(`Error checking if user ${user.email} exists:`, getUserError);
          migrationLog.write(`${user.email},${user.id},,ERROR,,Failed to check Supabase: ${getUserError.message}\n`);
          errorCount++;
          continue;
        }

        const existingUser = existingUsers.find(u => u.email === user.email);
        let newUserId;
        
        if (existingUser) {
          console.log(`User ${user.email} already exists in Supabase Auth with ID: ${existingUser.id}`);
          newUserId = existingUser.id;
          
          // Update user password in Supabase
          const { error: resetError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: securePassword }
          );
          
          if (resetError) {
            console.error(`Failed to update password for user ${user.email}:`, resetError);
            migrationLog.write(`${user.email},${user.id},${existingUser.id},WARNING,${securePassword},Failed to update password: ${resetError.message}\n`);
          } else {
            console.log(`Updated password for user ${user.email}`);
          }
        } else {
          // Create user in Supabase Auth
          const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: securePassword,
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
              username: user.username,
              first_name: user.firstName || '',
              last_name: user.lastName || ''
            }
          });

          if (createError) {
            console.error(`Error creating user ${user.email} in Supabase Auth:`, createError);
            migrationLog.write(`${user.email},${user.id},,ERROR,,Failed to create in Supabase: ${createError.message}\n`);
            errorCount++;
            continue;
          }

          console.log(`Created user ${user.email} in Supabase Auth with ID: ${newAuthUser.user.id}`);
          newUserId = newAuthUser.user.id;
        }
        
        // Handle restaurant associations before updating the user ID
        await migrateRestaurantAssociations(user.id, newUserId);
        
        // Update our database with the Supabase user ID
        const oldId = user.id;
        try {
          await db.update(users)
            .set({ 
              id: newUserId,
              // Use a special password value to indicate this user has been migrated
              password: await bcrypt.hash('SUPABASE_AUTH', 10)
            })
            .where(eq(users.id, oldId));
          
          console.log(`Updated user ${user.email} ID from ${oldId} to ${newUserId}`);
          migrationLog.write(`${user.email},${oldId},${newUserId},SUCCESS,${securePassword},\n`);
          successCount++;
        } catch (updateError) {
          console.error(`Error updating user ID in database:`, updateError);
          migrationLog.write(`${user.email},${oldId},${newUserId},ERROR,,Failed to update ID in database: ${updateError.message}\n`);
          errorCount++;
        }

      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        migrationLog.write(`${user.email},${user.id},,ERROR,,Unexpected error: ${userError.message}\n`);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users: ${dbUsers.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed to migrate: ${errorCount}`);
    console.log(`Detailed results saved in migration_results.csv`);
    
    console.log('\nMigration completed!');
    console.log('Note: Users will need to reset their passwords using the "Forgot Password" feature');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    migrationLog.end();
    process.exit(0);
  }
}

// Run the migration
migrateUsers();