import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the floor plan elements
export const elementSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  type: z.string(),
  category: z.string(),
  name: z.string(),
  color: z.string().optional(),
  isRound: z.boolean().optional(),
  zIndex: z.number(),
});

// Define the floor plan schema
export const floorPlans = pgTable("floor_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  elements: jsonb("elements").notNull(),
  background: jsonb("background"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define background settings schema
export const backgroundSettingsSchema = z.object({
  type: z.enum(['color', 'image', 'grid']),
  color: z.string(),
  imageUrl: z.string().nullable(),
  opacity: z.number(),
  showGrid: z.boolean(),
  gridSize: z.number(),
  gridColor: z.string(),
});

export const insertFloorPlanSchema = createInsertSchema(floorPlans).pick({
  name: true,
  elements: true,
  background: true,
}).extend({
  elements: z.array(elementSchema),
  background: backgroundSettingsSchema.optional(),
});

export type InsertFloorPlan = z.infer<typeof insertFloorPlanSchema>;
export type FloorPlan = typeof floorPlans.$inferSelect;

// Keep the existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
