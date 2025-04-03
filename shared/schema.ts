import { pgTable, text, uuid, integer, boolean, jsonb, timestamp, time, date, numeric, bigint } from "drizzle-orm/pg-core";
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

// The combined layout schema including elements and background
export const layoutSchema = z.object({
  elements: z.array(elementSchema),
  background: backgroundSettingsSchema,
});

// User table schema
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Restaurant table schema
export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Restaurant Users table schema
export const restaurantUsers = pgTable("restaurant_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  extraProperties: jsonb("extra_properties"),
});

// Floor Plan table schema - matches the Supabase schema
export const floorPlans = pgTable("floor_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  layout: jsonb("layout").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customers table schema
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schedule Services table schema
export const scheduleServices = pgTable("schedule_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id),
  floorPlanId: uuid("floor_plan_id").notNull().references(() => floorPlans.id),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(),
  recurrencePattern: text("recurrence_pattern"),
  applicableDays: text("applicable_days").array(),
  serviceDate: date("service_date"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  reservationDuration: integer("reservation_duration").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bookings table schema
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  scheduleServiceId: uuid("schedule_service_id").notNull().references(() => scheduleServices.id),
  floorPlanId: uuid("floor_plan_id").notNull().references(() => floorPlans.id),
  bookingTime: timestamp("booking_time").notNull(),
  partySize: integer("party_size").notNull(),
  tableReference: text("table_reference"),
  status: text("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Booking History table schema
export const bookingHistory = pgTable("booking_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  status: text("status").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Seating Areas table schema
export const seatingAreas = pgTable("seating_areas", {
  id: bigint("id", { mode: "number" }).primaryKey().notNull(),
  floorPlanId: uuid("id_floor_plan").notNull().references(() => floorPlans.id),
  name: text("name"),
  capacityRange: jsonb("capacity_range"),
  description: text("description"),
  x: text("x"),
  y: text("y"),
  properties: jsonb("properties"), 
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Schema for capacity range in seating areas
export const capacityRangeSchema = z.object({
  min: z.number().int().min(1),
  max: z.number().int().min(1),
  default: z.number().int().min(1)
});

// Schema for seating area properties
export const seatingAreaPropertiesSchema = z.object({
  type: z.string(),
  shape: z.string().optional(),
  color: z.string().optional(),
  isReservable: z.boolean().default(true),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).default('available'),
  additionalAttributes: z.record(z.string(), z.any()).optional()
});

// Schema for inserting seating areas
export const insertSeatingAreaSchema = z.object({
  floorPlanId: z.string().uuid(),
  name: z.string().min(1, "Seating area name is required"),
  capacityRange: capacityRangeSchema,
  description: z.string().optional(),
  x: z.number(),
  y: z.number(),
  properties: seatingAreaPropertiesSchema
});

// Schema for updating seating areas
export const updateSeatingAreaSchema = insertSeatingAreaSchema.partial();

// Schema for inserting floor plans
export const insertFloorPlanSchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1, "Floor plan name is required"),
  layout: layoutSchema,
  isDefault: z.boolean().default(false),
  createdBy: z.string().uuid()
});

// Schema for updating floor plans
export const updateFloorPlanSchema = insertFloorPlanSchema.partial();

// Schema for inserting restaurants
export const insertRestaurantSchema = z.object({
  ownerId: z.string().uuid(),
  name: z.string().min(1, "Restaurant name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

// Schema for updating restaurants
export const updateRestaurantSchema = insertRestaurantSchema.partial();

// Schema for user registration
export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  role: z.enum(["admin", "user"]).default("user"),
});

// Schema for user login
export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Schema for updating users
export const updateUserSchema = insertUserSchema.partial();

// Type definitions
export type InsertFloorPlan = z.infer<typeof insertFloorPlanSchema>;
export type UpdateFloorPlan = z.infer<typeof updateFloorPlanSchema>;
export type FloorPlan = typeof floorPlans.$inferSelect;

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type UpdateRestaurant = z.infer<typeof updateRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type User = typeof users.$inferSelect;
export type RestaurantUser = typeof restaurantUsers.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type ScheduleService = typeof scheduleServices.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingHistory = typeof bookingHistory.$inferSelect;
export type SeatingArea = typeof seatingAreas.$inferSelect;
export type InsertSeatingArea = z.infer<typeof insertSeatingAreaSchema>;
export type UpdateSeatingArea = z.infer<typeof updateSeatingAreaSchema>;
export type CapacityRange = z.infer<typeof capacityRangeSchema>;
export type SeatingAreaProperties = z.infer<typeof seatingAreaPropertiesSchema>;

// Floor plan layout types
export type FloorPlanElement = z.infer<typeof elementSchema>;
export type BackgroundSettings = z.infer<typeof backgroundSettingsSchema>;
export type FloorPlanLayout = z.infer<typeof layoutSchema>;
