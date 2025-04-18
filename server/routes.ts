import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { supabase } from "./supabase";
import { 
  insertFloorPlanSchema, 
  updateFloorPlanSchema,
  insertRestaurantSchema,
  updateRestaurantSchema,
  insertSeatingAreaSchema,
  updateSeatingAreaSchema,
  insertUserSchema,
  loginUserSchema,
  FloorPlanLayout
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Middleware to handle common errors
  const handleErrors = (fn: (req: Request, res: Response) => Promise<any>) => {
    return async (req: Request, res: Response) => {
      try {
        await fn(req, res);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            error: 'Validation error', 
            details: error.errors 
          });
        }
        
        console.error('Request error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  };

  // Restaurant routes
  app.get('/api/restaurants', handleErrors(async (req, res) => {
    const restaurants = await storage.getAllRestaurants();
    res.json(restaurants);
  }));

  app.get('/api/restaurants/:id', handleErrors(async (req, res) => {
    const id = req.params.id;
    const restaurant = await storage.getRestaurant(id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  }));

  app.post('/api/restaurants', handleErrors(async (req, res) => {
    const data = insertRestaurantSchema.parse(req.body);
    const restaurant = await storage.createRestaurant(data);
    res.status(201).json(restaurant);
  }));

  app.put('/api/restaurants/:id', handleErrors(async (req, res) => {
    const id = req.params.id;
    const data = updateRestaurantSchema.parse(req.body);
    
    const restaurant = await storage.updateRestaurant(id, data);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  }));

  app.delete('/api/restaurants/:id', handleErrors(async (req, res) => {
    const id = req.params.id;
    const success = await storage.deleteRestaurant(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.status(204).end();
  }));

  // User routes - auth routes are handled by setupAuth
  // Current authenticated user's restaurants (no ID needed, uses auth token)
  app.get('/api/user/restaurants', handleErrors(async (req, res) => {
    // Get the user from the request (set by Supabase auth middleware)
    const token = req.headers.authorization?.split(' ')[1] || 
                req.cookies?.supabase_auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the user from Supabase
    const { data: supabaseData } = await supabase.auth.getUser(token);
    
    if (!supabaseData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const supabaseUserId = supabaseData.user.id;
    const email = supabaseData.user.email;
    
    console.log(`[restaurants] Fetching restaurants for Supabase user ID: ${supabaseUserId}, email: ${email}`);
    
    // First try with Supabase user ID
    let restaurants = await storage.getCurrentUserRestaurants(supabaseUserId);
    
    // If no restaurants found and we have an email, try to find the user by email
    if (restaurants.length === 0 && email) {
      console.log(`[restaurants] No restaurants found by Supabase ID, trying to find user by email`);
      const dbUser = await storage.getUserByEmail(email);
      
      if (dbUser) {
        console.log(`[restaurants] Found user in database with ID: ${dbUser.id}, trying to get restaurants with this ID`);
        restaurants = await storage.getCurrentUserRestaurants(dbUser.id);
      }
    }
    
    res.json(restaurants);
  }));

  // Restaurant Users routes
  app.get('/api/restaurants/:restaurantId/users', handleErrors(async (req, res) => {
    const restaurantId = req.params.restaurantId;
    const users = await storage.getRestaurantUsers(restaurantId);
    res.json(users);
  }));

  // Get user by ID
  app.get('/api/user/:id', handleErrors(async (req, res) => {
    const id = req.params.id;
    const user = await storage.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from the response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  }));

  // Current User Restaurants route
  app.get('/api/user/:userId/restaurants', handleErrors(async (req, res) => {
    const userId = req.params.userId;
    const restaurants = await storage.getCurrentUserRestaurants(userId);
    res.json(restaurants);
  }));

  // Floor Plan routes
  app.get('/api/restaurants/:restaurantId/floorplans', handleErrors(async (req, res) => {
    const restaurantId = req.params.restaurantId;
    const floorPlans = await storage.getAllFloorPlans(restaurantId);
    res.json(floorPlans);
  }));

  app.get('/api/restaurants/:restaurantId/floorplans/default', handleErrors(async (req, res) => {
    const restaurantId = req.params.restaurantId;
    const floorPlan = await storage.getDefaultFloorPlan(restaurantId);
    
    if (!floorPlan) {
      return res.status(404).json({ error: 'No floor plan found for this restaurant' });
    }
    
    res.json(floorPlan);
  }));

  app.get('/api/floorplans/:id', handleErrors(async (req, res) => {
    const id = req.params.id;
    const floorPlan = await storage.getFloorPlan(id);
    
    if (!floorPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    
    res.json(floorPlan);
  }));

  app.post('/api/floorplans', handleErrors(async (req, res) => {
    const data = insertFloorPlanSchema.parse(req.body);
    const floorPlan = await storage.createFloorPlan(data);
    res.status(201).json(floorPlan);
  }));

  app.put('/api/floorplans/:id', handleErrors(async (req, res) => {
    const id = req.params.id;
    const data = updateFloorPlanSchema.parse(req.body);
    
    const floorPlan = await storage.updateFloorPlan(id, data);
    if (!floorPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    
    res.json(floorPlan);
  }));

  app.delete('/api/floorplans/:id', handleErrors(async (req, res) => {
    const id = req.params.id;
    
    try {
      console.log(`Request to delete floor plan with ID: ${id}`);
      const success = await storage.deleteFloorPlan(id);
      
      if (!success) {
        console.log(`Floor plan with ID ${id} not found for deletion`);
        return res.status(404).json({ error: 'Floor plan not found' });
      }
      
      console.log(`Floor plan with ID ${id} successfully deleted`);
      res.status(204).end();
    } catch (error) {
      console.error(`Error in delete floor plan route: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // This will be caught by the handleErrors wrapper
    }
  }));

  // Seating Areas routes
  app.get('/api/floorplans/:floorPlanId/seatingareas', handleErrors(async (req, res) => {
    const floorPlanId = req.params.floorPlanId;
    const seatingAreas = await storage.getSeatingAreasByFloorPlan(floorPlanId);
    res.json(seatingAreas);
  }));

  app.get('/api/seatingareas/:id', handleErrors(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid seating area ID' });
    }
    
    const seatingArea = await storage.getSeatingArea(id);
    
    if (!seatingArea) {
      return res.status(404).json({ error: 'Seating area not found' });
    }
    
    res.json(seatingArea);
  }));

  app.post('/api/seatingareas', handleErrors(async (req, res) => {
    const data = insertSeatingAreaSchema.parse(req.body);
    const seatingArea = await storage.createSeatingArea(data);
    res.status(201).json(seatingArea);
  }));

  app.put('/api/seatingareas/:id', handleErrors(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid seating area ID' });
    }
    
    const data = updateSeatingAreaSchema.parse(req.body);
    
    const seatingArea = await storage.updateSeatingArea(id, data);
    if (!seatingArea) {
      return res.status(404).json({ error: 'Seating area not found' });
    }
    
    res.json(seatingArea);
  }));

  app.delete('/api/seatingareas/:id', handleErrors(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid seating area ID' });
    }
    
    const success = await storage.deleteSeatingArea(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Seating area not found' });
    }
    
    res.status(204).end();
  }));

  const httpServer = createServer(app);
  return httpServer;
}
