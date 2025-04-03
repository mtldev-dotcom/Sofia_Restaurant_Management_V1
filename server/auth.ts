import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { db, pool } from "./db";
import { User as SchemaUser, users, restaurantUsers } from "@shared/schema";
import { supabase } from "./supabase";
import { createServerClient } from '@supabase/ssr';
import { CookieOptions } from "express";
import { createClient } from '@supabase/supabase-js';
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Initialize Supabase admin client for user management
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

declare global {
  namespace Express {
    interface Request {
      supabase: ReturnType<typeof createServerClient>;
    }
  }
}

const PostgresSessionStore = connectPg(session);

// Define cookie options for Supabase auth
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Function to extract auth token from request
const getToken = (req: Request): string | null => {
  // Try to get from authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try to get from cookies
  console.log('Auth cookies:', req.cookies);
  return req.cookies?.supabase_auth_token || null;
};

export function setupAuth(app: Express) {
  // Callback route for Supabase auth redirects
  app.get("/auth/callback", async (req, res) => {
    const code = req.query.code as string;
    
    if (code) {
      // Exchange auth code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return res.redirect('/auth?error=auth_callback_error');
      }
      
      if (data.session) {
        res.cookie('supabase_auth_token', data.session.access_token, cookieOptions);
      }
    }
    
    // Redirect to home page
    res.redirect('/');
  });
  const sessionStore = new PostgresSessionStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "default-secret-change-me",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  // Set up session middleware
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  
  // Middleware to create Supabase client for each request
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
      {
        cookies: {
          get: (name) => req.cookies?.[name],
          set: (name, value, options) => {
            res.cookie(name, value, options);
          },
          remove: (name, options) => {
            res.clearCookie(name, options);
          },
        },
      }
    );
    next();
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { 
        email, 
        password, 
        username, 
        firstName, 
        lastName, 
        restaurantOption, 
        restaurantName, 
        restaurantAddress, 
        inviteCode, 
        confirmPassword,
        ...userData 
      } = req.body;
      
      // Register user with Supabase Auth
      // Use admin client to create user with email confirmation bypassed for development
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          username,
          first_name: firstName,
          last_name: lastName,
        }
      });
      
      if (authError) {
        return res.status(400).json({ error: authError.message });
      }
      
      // If no user was created or no user ID is available, return an error
      if (!authData.user || !authData.user.id) {
        return res.status(500).json({ error: "Failed to create user" });
      }
      
      // Create the user in our database too
      const user = await storage.createUser({
        id: authData.user.id, // Use Supabase user ID
        username,
        firstName,
        lastName,
        email,
        password: "SUPABASE_AUTH", // We don't need to store the password anymore
        ...userData
      });
      
      // Handle restaurant creation or joining
      console.log('Restaurant options:', { restaurantOption, restaurantName, restaurantAddress });

      if (restaurantOption === "create" && restaurantName) {
        console.log(`Creating restaurant "${restaurantName}" for user ${user.id}`);
        try {
          // Create a new restaurant for the user
          const restaurant = await storage.createRestaurant({
            name: restaurantName,
            address: restaurantAddress || "",
            ownerId: user.id,
            status: "active",
          });

          console.log(`Restaurant created with ID: ${restaurant.id}`);

          // Add the user as the owner/admin of the restaurant
          await storage.linkUserToRestaurant(user.id, restaurant.id, "owner");
          console.log(`User ${user.id} linked to restaurant ${restaurant.id} as owner`);
        } catch (error) {
          console.error('Error creating restaurant:', error);
        }
      } 
      else if (restaurantOption === "join" && inviteCode) {
        // Attempt to join a restaurant with the invite code
        console.log(`User ${user.id} attempting to join a restaurant with invite code: ${inviteCode}`);
        // For now, we'll just log it
      }
      else {
        console.log(`No restaurant created. Option: ${restaurantOption}, Name: ${restaurantName || 'None'}`);
      }
      
      // For admin-created users, we need to generate a session manually
      // since createUser doesn't return a session
      if (authData.user) {
        // Sign in the user to get a session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!signInError && signInData.session) {
          res.cookie('supabase_auth_token', signInData.session.access_token, cookieOptions);
        } else {
          console.error("Failed to create session after registration:", signInError);
        }
      }
            
      // Remove password from the response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      
      // Get the user from our database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found in database" });
      }
      
      // Set the session in the browser's cookies
      if (data.session) {
        res.cookie('supabase_auth_token', data.session.access_token, cookieOptions);
      }
      
      // Remove password from the response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", async (req, res, next) => {
    try {
      // Sign out from Supabase
      const { error } = await req.supabase.auth.signOut();
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      // Clear the auth cookie
      res.clearCookie('supabase_auth_token');
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // This endpoint is for migrating a user to Supabase Auth during the transition period
  app.post("/api/auth/migrate-user", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      console.log(`[auth] Migration requested for email: ${email}`);
      
      // Get the user from our database
      const dbUser = await storage.getUserByEmail(email);
      
      if (!dbUser) {
        console.log(`[auth] Migration failed: User with email ${email} not found in database`);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`[auth] Found user in database with ID: ${dbUser.id}`);
      
      // For migration, we'll try multiple authentication methods
      
      // Method 1: Try username-based validation through storage interface
      let user = await storage.validateUserCredentials(dbUser.username, password);
      let isCredentialValid = user !== null;
      console.log(`[auth] Username validation result: ${isCredentialValid}`);
      
      // Method 2: If username validation fails, try direct email-based login
      if (!isCredentialValid && dbUser.email) {
        // Some users might be logging in with email but our validateUserCredentials uses username
        // Try direct email validation
        user = await storage.validateUserCredentials(dbUser.email, password);
        isCredentialValid = user !== null;
        console.log(`[auth] Email validation result: ${isCredentialValid}`);
      }
      
      // Method 3: If both fail, try direct password check
      if (!isCredentialValid) {
        try {
          console.log(`[auth] Standard validation failed, attempting direct password verification`);
          
          // Check if the stored password uses the correct format for our verification
          const storedPassword = dbUser.password;
          
          if (storedPassword && storedPassword.includes('.')) {
            // Use the crypto and util modules that are already imported at the top
            const scryptAsync = promisify(scrypt);
            
            // Split the stored hash and salt
            const [hashed, salt] = storedPassword.split(".");
            if (hashed && salt) {
              // Hash the supplied password with the same salt
              const hashedBuf = Buffer.from(hashed, "hex");
              const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
              
              // Compare the hashes using a time-constant comparison function
              isCredentialValid = timingSafeEqual(hashedBuf, suppliedBuf);
              console.log(`[auth] Direct password verification result: ${isCredentialValid}`);
            }
          } else {
            // For users already migrated, the password might be a special placeholder
            if (storedPassword === "SUPABASE_AUTH") {
              console.log(`[auth] This user has already been migrated, trying direct Supabase authentication`);
              
              // Try to sign in directly with Supabase
              const { data, error } = await supabase.auth.signInWithPassword({
                email: dbUser.email,
                password
              });
              
              if (!error && data.user) {
                isCredentialValid = true;
                console.log(`[auth] Successfully validated with Supabase directly`);
              }
            }
          }
        } catch (pwError) {
          console.error('[auth] Error during direct password verification:', pwError);
        }
      }
      
      // For development convenience - add a master migration password option
      // This should be removed in production
      if (!isCredentialValid && process.env.NODE_ENV === 'development' && 
          process.env.MIGRATION_MASTER_PASSWORD && 
          password === process.env.MIGRATION_MASTER_PASSWORD) {
        console.log(`[auth] Using master migration password for debugging`);
        isCredentialValid = true;
      }
      
      // For easier debugging/development in testing environments 
      // Allow skipping password validation completely with MIGRATION_SKIP_PASSWORD=true
      if (!isCredentialValid && process.env.NODE_ENV === 'development' && 
          process.env.MIGRATION_SKIP_PASSWORD === 'true') {
        console.log(`[auth] ⚠️ WARNING: Skipping password validation for development`);
        isCredentialValid = true;
      }
      
      if (!isCredentialValid) {
        console.log(`[auth] Migration failed: Invalid credentials for user ${dbUser.username}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      console.log(`[auth] Credentials validated successfully`);
      
      // Get user's restaurant associations before migration
      const restaurantAssociations = await storage.getCurrentUserRestaurants(dbUser.id);
      console.log(`[auth] User has ${restaurantAssociations.length} restaurant associations`);
      
      // Check if user already has a Supabase Auth account by email
      const { data: { users: existingUsers }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (getUserError) {
        console.error(`[auth] Error fetching Supabase users:`, getUserError);
        return res.status(500).json({ error: "Error checking Supabase Auth: " + getUserError.message });
      }
      
      const existingUser = existingUsers.find(u => u.email === email);
      let newUserId: string;
      
      if (existingUser) {
        console.log(`[auth] User already exists in Supabase with ID: ${existingUser.id}`);
        newUserId = existingUser.id;
        
        // If the password in Supabase doesn't match, update it
        try {
          // Try to sign in with the password to see if it matches
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError && signInError.message.includes("Invalid login credentials")) {
            console.log(`[auth] Updating password in Supabase for user ${existingUser.id}`);
            // Update password in Supabase
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              existingUser.id,
              { password }
            );
            
            if (updateError) {
              console.error(`[auth] Error updating password:`, updateError);
              return res.status(500).json({ error: "Failed to update password in Supabase: " + updateError.message });
            }
          }
        } catch (passwordError) {
          console.error(`[auth] Error checking password:`, passwordError);
        }
      } else {
        console.log(`[auth] Creating new user in Supabase Auth`);
        // Create user in Supabase Auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            username: dbUser.username,
            first_name: dbUser.firstName,
            last_name: dbUser.lastName
          }
        });
        
        if (createError) {
          console.error(`[auth] Error creating user in Supabase:`, createError);
          return res.status(500).json({ error: "Error creating Supabase Auth user: " + createError.message });
        }
        
        if (!newUser || !newUser.user) {
          console.error(`[auth] User created but data is missing`);
          return res.status(500).json({ error: "Error creating Supabase Auth user: No user data returned" });
        }
        
        console.log(`[auth] User created in Supabase with ID: ${newUser.user.id}`);
        newUserId = newUser.user.id;
      }
      
      // First update database user ID to match Supabase ID if they're different
      // This needs to happen BEFORE we try to create restaurant associations
      if (dbUser.id !== newUserId) {
        console.log(`[auth] Updating user ID in database from ${dbUser.id} to ${newUserId}`);
        try {
          // Instead of creating a new user, let's handle the existing user cases by checking both email and ID
          const existingUserById = await storage.getUserById(newUserId);
          const existingUserByEmail = await storage.getUserByEmail(dbUser.email);
          
          // If there's a user with the Supabase ID but different email
          if (existingUserById && existingUserById.email !== dbUser.email) {
            console.log(`[auth] User with ID ${newUserId} exists but has different email (${existingUserById.email})`);
            console.log(`[auth] Deleting conflicting user to avoid duplicate issues`);
            await storage.deleteUser(existingUserById.id);
            console.log(`[auth] Deleted conflicting user record`);
          }
          
          // If there's a user with the same email but different ID than the Supabase ID
          if (existingUserByEmail && existingUserByEmail.id !== newUserId) {
            console.log(`[auth] User with email ${dbUser.email} exists with ID ${existingUserByEmail.id}`);
            
            // If it's the same user we're trying to migrate
            if (existingUserByEmail.id === dbUser.id) {
              console.log(`[auth] This is the same user, updating ID directly`);
              // Execute a direct SQL update to change the user ID
              try {
                const updateResult = await pool.query(
                  `UPDATE users SET id = $1 WHERE id = $2`,
                  [newUserId, dbUser.id]
                );
                console.log(`[auth] Direct SQL update affected ${updateResult.rowCount} rows`);
              } catch (sqlError) {
                console.error(`[auth] Error with direct SQL update:`, sqlError);
              }
            } else {
              console.log(`[auth] This is a different user with the same email, deleting to avoid conflicts`);
              await storage.deleteUser(existingUserByEmail.id);
              console.log(`[auth] Deleted conflicting user by email`);
              
              // Then update the original user's ID
              try {
                const updateResult = await pool.query(
                  `UPDATE users SET id = $1 WHERE id = $2`,
                  [newUserId, dbUser.id]
                );
                console.log(`[auth] Direct SQL update affected ${updateResult.rowCount} rows`);
              } catch (sqlError) {
                console.error(`[auth] Error with direct SQL update:`, sqlError);
              }
            }
          } else {
            // No conflicting users, just update the ID
            console.log(`[auth] No conflicting users, updating ID with direct SQL`);
            try {
              const updateResult = await pool.query(
                `UPDATE users SET id = $1 WHERE id = $2`,
                [newUserId, dbUser.id]
              );
              console.log(`[auth] Direct SQL update affected ${updateResult.rowCount} rows`);
            } catch (sqlError) {
              console.error(`[auth] Error with direct SQL update:`, sqlError);
              
              // If direct SQL fails, try one more approach - delete and recreate
              console.log(`[auth] Trying alternative: Delete and recreate user`);
              try {
                // First get all user data
                const userData = {
                  id: newUserId,
                  username: dbUser.username,
                  email: dbUser.email,
                  firstName: dbUser.firstName,
                  lastName: dbUser.lastName,
                  password: dbUser.password,
                  role: dbUser.role,
                  phoneNumber: dbUser.phoneNumber,
                  createdAt: dbUser.createdAt,
                  updatedAt: new Date()
                };
                
                // Delete the old user
                await pool.query(`DELETE FROM users WHERE id = $1`, [dbUser.id]);
                
                // Create a new user with the same data but new ID
                await pool.query(`
                  INSERT INTO users (id, username, email, first_name, last_name, password, role, phone_number, created_at, updated_at)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                  userData.id, userData.username, userData.email, 
                  userData.firstName, userData.lastName, userData.password,
                  userData.role, userData.phoneNumber, userData.createdAt, userData.updatedAt
                ]);
                
                console.log(`[auth] Successfully recreated user with new ID ${newUserId}`);
              } catch (finalError) {
                console.error(`[auth] Final approach failed:`, finalError);
                return res.status(500).json({ 
                  error: "Migration failed. Please try again or contact support.",
                  details: "We encountered an issue updating your user ID."
                });
              }
            }
          }
        } catch (updateError) {
          console.error(`[auth] Error during user ID migration:`, updateError);
          return res.status(500).json({ 
            error: "User migration failed. Please contact support.",
            details: "We encountered an error while updating your user data." 
          });
        }
      }
      
      // Now we need to verify the user with the new ID exists before proceeding
      const verifyUser = await storage.getUserById(newUserId);
      if (!verifyUser) {
        console.error(`[auth] Critical error: User with ID ${newUserId} still doesn't exist after migration`);
        return res.status(500).json({ error: "User migration failed. Please try again or contact support." });
      }
      
      console.log(`[auth] Verified that user with ID ${newUserId} exists in the database`);
      
      // Now handle restaurant associations AFTER the user ID has been updated
      if (restaurantAssociations.length > 0) {
        console.log(`[auth] Migrating ${restaurantAssociations.length} restaurant associations`);
        
        for (const { restaurant, role } of restaurantAssociations) {
          try {
            // Check if association already exists
            const existingAssociations = await storage.getRestaurantUsers(restaurant.id);
            const alreadyAssociated = existingAssociations.some(
              assoc => assoc.userId === newUserId && assoc.restaurantId === restaurant.id
            );
            
            if (!alreadyAssociated) {
              console.log(`[auth] Creating association between user ${newUserId} and restaurant ${restaurant.id} with role ${role}`);
              
              // Try a more direct SQL approach that can handle potential database state issues
              try {
                // First check if this exact association already exists in the database
                const checkResult = await pool.query(
                  `SELECT COUNT(*) FROM restaurant_users WHERE user_id = $1 AND restaurant_id = $2`,
                  [newUserId, restaurant.id]
                );
                
                const exists = parseInt(checkResult.rows[0]?.count) > 0;
                
                if (exists) {
                  console.log(`[auth] Association already exists in database, updating role if needed`);
                  await pool.query(
                    `UPDATE restaurant_users SET role = $1, updated_at = NOW() 
                     WHERE user_id = $2 AND restaurant_id = $3`,
                    [role, newUserId, restaurant.id]
                  );
                } else {
                  console.log(`[auth] Creating fresh association with direct SQL`);
                  const insertResult = await pool.query(
                    `INSERT INTO restaurant_users (user_id, restaurant_id, role, created_at, updated_at)
                     VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
                    [newUserId, restaurant.id, role]
                  );
                  
                  if (insertResult.rows && insertResult.rows.length > 0) {
                    console.log(`[auth] Successfully created association with ID: ${insertResult.rows[0].id}`);
                  } else {
                    console.log(`[auth] Association created but could not retrieve ID`);
                  }
                }
              } catch (directInsertError) {
                console.error(`[auth] Error with direct SQL restaurant association:`, directInsertError);
                
                // If we get a foreign key constraint error, there might be an issue with the database state
                // Let's provide more helpful information
                if (directInsertError.toString().includes('foreign key constraint')) {
                  console.log(`[auth] Foreign key constraint error detected - checking database state`);
                  
                  // Check if the user exists in the database
                  const userCheck = await pool.query(
                    `SELECT id FROM users WHERE id = $1`,
                    [newUserId]
                  );
                  
                  const userExists = userCheck.rows.length > 0;
                  
                  // Check if the restaurant exists in the database
                  const restaurantCheck = await pool.query(
                    `SELECT id FROM restaurants WHERE id = $1`,
                    [restaurant.id]
                  );
                  
                  const restaurantExists = restaurantCheck.rows.length > 0;
                  
                  console.log(`[auth] Database state check: User exists: ${userExists}, Restaurant exists: ${restaurantExists}`);
                  
                  if (!userExists) {
                    console.error(`[auth] User with ID ${newUserId} does not exist in the database`);
                  }
                  
                  if (!restaurantExists) {
                    console.error(`[auth] Restaurant with ID ${restaurant.id} does not exist in the database`);
                  }
                }
              }
            } else {
              console.log(`[auth] Association already exists between user ${newUserId} and restaurant ${restaurant.id}`);
            }
          } catch (associationError) {
            console.error(`[auth] Error creating restaurant association:`, associationError);
            // Continue with other associations even if one fails
          }
        }
      }
      
      // Now that we have successfully migrated the user and associations,
      // we can safely delete the old user record with the previous ID
      if (dbUser.id !== newUserId) {
        console.log(`[auth] Deleting old user record with ID: ${dbUser.id}`);
        try {
          await storage.deleteUser(dbUser.id);
          console.log(`[auth] Successfully deleted old user record`);
        } catch (deleteError) {
          console.warn(`[auth] Warning: Could not delete old user record:`, deleteError);
          // Non-critical error, continue with migration
        }
      }
      
      // Sign in to get a session
      console.log(`[auth] Signing in user to create session`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error(`[auth] Error signing in after migration:`, error);
        return res.status(401).json({ error: "Authentication failed after migration: " + error.message });
      }
      
      // Set the session cookie
      if (data.session) {
        console.log(`[auth] Setting session cookie`);
        res.cookie('supabase_auth_token', data.session.access_token, cookieOptions);
      }
      
      console.log(`[auth] Migration completed successfully`);
      return res.json({ 
        message: "User migrated successfully", 
        user: { ...dbUser, id: newUserId, password: undefined } 
      });
      
    } catch (error) {
      console.error(`[auth] Migration error:`, error);
      res.status(500).json({ error: "Migration failed: " + (error as Error).message });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      // Get the token from the request
      const token = getToken(req);
      
      if (!token) {
        console.log('[auth] No token found in request');
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      console.log('[auth] Token found, verifying with Supabase');
      
      // Get the user from Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.log('[auth] Supabase getUser error:', error);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      
      if (!data.user) {
        console.log('[auth] No user returned from Supabase');
        return res.status(401).json({ error: "No user found for token" });
      }
      
      console.log('[auth] Supabase user found:', data.user.id);
      
      // Get the user from our database by Supabase ID
      let user = await storage.getUserById(data.user.id);
      
      // If user not found by ID, try to find by email
      if (!user && data.user.email) {
        console.log('[auth] User not found by ID, trying email lookup:', data.user.email);
        user = await storage.getUserByEmail(data.user.email);
        
        if (user) {
          console.log('[auth] User found by email, need to update ID');
          // We found a user with the same email, but different ID
          // This means we need to update the user's ID in our database
          try {
            // Try to find if there are any restaurant associations
            const restaurants = await storage.getCurrentUserRestaurants(user.id);
            
            if (restaurants && restaurants.length > 0) {
              console.log('[auth] User has restaurant associations, using migration dialog instead');
              // If there are restaurant associations, we can't just update the ID
              // Return a special response to trigger the migration dialog
              return res.status(409).json({ 
                error: "User needs migration",
                code: "NEEDS_MIGRATION",
                email: data.user.email
              });
            } else {
              console.log('[auth] User has no restaurant associations, updating ID directly');
              // If there are no restaurant associations, we can update the ID directly
              user = await storage.updateUser(user.id, { id: data.user.id });
            }
          } catch (updateError) {
            console.error('[auth] Error updating user ID:', updateError);
            return res.status(500).json({ error: "Failed to update user ID" });
          }
        }
      }
      
      if (!user) {
        console.log('[auth] User not found in database');
        // If we still can't find the user, check if we need to create one from Supabase data
        if (data.user.email && data.user.user_metadata) {
          console.log('[auth] Creating new user from Supabase data');
          try {
            // Create a new user in our database
            user = await storage.createUser({
              id: data.user.id,
              email: data.user.email,
              username: data.user.user_metadata.username || data.user.email.split('@')[0],
              firstName: data.user.user_metadata.first_name || '',
              lastName: data.user.user_metadata.last_name || '',
              password: "SUPABASE_AUTH", // We don't need a real password
              role: "user"
            });
            console.log('[auth] Created new user with ID:', user.id);
          } catch (createError) {
            console.error('[auth] Error creating user:', createError);
            return res.status(500).json({ error: "Failed to create user" });
          }
        } else {
          return res.status(404).json({ error: "User not found in database" });
        }
      }
      
      console.log('[auth] User found in database, returning user data');
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('[auth] Server error:', error);
      res.status(500).json({ error: "Server error" });
    }
  });
}