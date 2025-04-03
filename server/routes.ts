import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFloorPlanSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get('/api/floorplans', async (req, res) => {
    try {
      const floorPlans = await storage.getAllFloorPlans();
      res.json(floorPlans);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch floor plans' });
    }
  });

  app.get('/api/floorplans/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid floor plan ID' });
      }
      
      const floorPlan = await storage.getFloorPlan(id);
      if (!floorPlan) {
        return res.status(404).json({ error: 'Floor plan not found' });
      }
      
      res.json(floorPlan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch floor plan' });
    }
  });

  app.post('/api/floorplans', async (req, res) => {
    try {
      const result = insertFloorPlanSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      const floorPlan = await storage.createFloorPlan(result.data);
      res.status(201).json(floorPlan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create floor plan' });
    }
  });

  app.put('/api/floorplans/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid floor plan ID' });
      }
      
      const result = insertFloorPlanSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }
      
      const floorPlan = await storage.updateFloorPlan(id, result.data);
      if (!floorPlan) {
        return res.status(404).json({ error: 'Floor plan not found' });
      }
      
      res.json(floorPlan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update floor plan' });
    }
  });

  app.delete('/api/floorplans/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid floor plan ID' });
      }
      
      const success = await storage.deleteFloorPlan(id);
      if (!success) {
        return res.status(404).json({ error: 'Floor plan not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete floor plan' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
