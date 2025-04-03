import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";
import { User as SchemaUser } from "@shared/schema";
import { supabase } from "./supabase";
import { createServerClient } from '@supabase/ssr';
import { CookieOptions } from "express";
import { createClient } from '@supabase/supabase-js';

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
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
      if (restaurantOption === "create" && restaurantName) {
        // Create a new restaurant for the user
        const restaurant = await storage.createRestaurant({
          name: restaurantName,
          address: restaurantAddress || "",
          ownerId: user.id,
          status: "active",
        });

        // Add the user as the owner/admin of the restaurant
        await storage.linkUserToRestaurant(user.id, restaurant.id, "owner");
      } 
      else if (restaurantOption === "join" && inviteCode) {
        // Attempt to join a restaurant with the invite code
        console.log(`User ${user.id} attempting to join a restaurant with invite code: ${inviteCode}`);
        // For now, we'll just log it
      }
      
      // Set the session in the browser's cookies
      if (authData.session) {
        res.cookie('supabase_auth_token', authData.session.access_token, cookieOptions);
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
      
      // Get the user from our database
      const dbUser = await storage.getUserByEmail(email);
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Validate credentials with our database password
      const isCredentialValid = await storage.validateUserCredentials(dbUser.username, password);
      
      if (!isCredentialValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Check if user already has a Supabase Auth account by email
      const { data: { users: existingUsers }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (getUserError) {
        return res.status(500).json({ error: "Error checking Supabase Auth: " + getUserError.message });
      }
      
      const existingUser = existingUsers.find(u => u.email === email);
      
      if (existingUser) {
        // User already exists in Supabase Auth, just update the ID in our database
        await storage.updateUser(dbUser.id, { id: existingUser.id });
        
        // Sign in to get a session
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          return res.status(401).json({ error: "Authentication failed: " + error.message });
        }
        
        // Set the session cookie
        if (data.session) {
          res.cookie('supabase_auth_token', data.session.access_token, cookieOptions);
        }
        
        return res.json({ 
          message: "User migrated successfully", 
          user: { ...dbUser, id: existingUser.id, password: undefined } 
        });
      }
      
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
        return res.status(500).json({ error: "Error creating Supabase Auth user: " + createError.message });
      }
      
      // Update our database with the Supabase user ID
      await storage.updateUser(dbUser.id, { id: newUser.user.id });
      
      // Sign in to get a session
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ error: "Authentication failed after migration: " + error.message });
      }
      
      // Set the session cookie
      if (data.session) {
        res.cookie('supabase_auth_token', data.session.access_token, cookieOptions);
      }
      
      return res.json({ 
        message: "User migrated successfully", 
        user: { ...dbUser, id: newUser.user.id, password: undefined } 
      });
      
    } catch (error) {
      res.status(500).json({ error: "Migration failed: " + (error as Error).message });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      // Get the token from the request
      const token = getToken(req);
      
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get the user from Supabase
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
      
      if (error || !supabaseUser) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      
      // Get the user from our database
      const user = await storage.getUserById(supabaseUser.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found in database" });
      }
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });
}