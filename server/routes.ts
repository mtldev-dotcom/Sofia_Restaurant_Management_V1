import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFloorPlanSchema, 
  updateFloorPlanSchema,
  insertRestaurantSchema,
  updateRestaurantSchema,
  insertSeatingAreaSchema,
  updateSeatingAreaSchema,
  FloorPlanLayout
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Restaurant Users routes
  app.get('/api/restaurants/:restaurantId/users', handleErrors(async (req, res) => {
    const restaurantId = req.params.restaurantId;
    const users = await storage.getRestaurantUsers(restaurantId);
    res.json(users);
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
    const success = await storage.deleteFloorPlan(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    
    res.status(204).end();
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
