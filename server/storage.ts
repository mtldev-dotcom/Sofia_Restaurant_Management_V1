import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { 
  type User, 
  type FloorPlan, 
  type InsertFloorPlan, 
  type UpdateFloorPlan, 
  type Restaurant, 
  type InsertRestaurant,
  type UpdateRestaurant,
  type RestaurantUser,
  type FloorPlanLayout,
  type SeatingArea,
  type InsertSeatingArea,
  type UpdateSeatingArea,
  type InsertUser,
  type UpdateUser,
  type LoginUser,
  layoutSchema,
  users,
  restaurants,
  restaurantUsers,
  floorPlans,
  seatingAreas
} from "@shared/schema";
import { db, pool } from './db';
import { eq, and, desc, sql } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

// Storage interface

export interface IStorage {
  // Restaurant methods
  getRestaurant(id: string): Promise<Restaurant | null>;
  getAllRestaurants(): Promise<Restaurant[]>;
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, restaurant: UpdateRestaurant): Promise<Restaurant | null>;
  deleteRestaurant(id: string): Promise<boolean>;
  
  // Floor plan methods
  getAllFloorPlans(restaurantId: string): Promise<FloorPlan[]>;
  getFloorPlan(id: string): Promise<FloorPlan | null>;
  getDefaultFloorPlan(restaurantId: string): Promise<FloorPlan | null>;
  createFloorPlan(floorPlan: InsertFloorPlan): Promise<FloorPlan>;
  updateFloorPlan(id: string, floorPlan: UpdateFloorPlan): Promise<FloorPlan | null>;
  deleteFloorPlan(id: string): Promise<boolean>;
  
  // Seating Areas methods
  getSeatingAreasByFloorPlan(floorPlanId: string): Promise<SeatingArea[]>;
  getSeatingArea(id: number): Promise<SeatingArea | null>;
  createSeatingArea(seatingArea: InsertSeatingArea): Promise<SeatingArea>;
  updateSeatingArea(id: number, seatingArea: UpdateSeatingArea): Promise<SeatingArea | null>;
  deleteSeatingArea(id: number): Promise<boolean>;
  
  // Restaurant Users methods
  getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]>;
  linkUserToRestaurant(userId: string, restaurantId: string, role: string): Promise<RestaurantUser>;
  
  // Current user methods
  getCurrentUserRestaurants(userId: string): Promise<{ restaurant: Restaurant, role: string }[]>;
  
  // User authentication methods
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;
  
  // Session store
  sessionStore: session.Store;
}

// Drizzle storage implementation
export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true
    });
  }
  // Restaurant methods
  async getRestaurant(id: string): Promise<Restaurant | null> {
    try {
      const results = await db.select().from(restaurants).where(eq(restaurants.id, id));
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
  }
  
  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      return await db.select().from(restaurants).orderBy(restaurants.name);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  }
  
  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    try {
      return await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, ownerId))
        .orderBy(restaurants.name);
    } catch (error) {
      console.error('Error fetching owner restaurants:', error);
      return [];
    }
  }
  
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    try {
      const results = await db
        .insert(restaurants)
        .values({
          ownerId: restaurant.ownerId,
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          email: restaurant.email
        })
        .returning();
      
      if (results.length === 0) {
        throw new Error('Failed to create restaurant');
      }
      
      return results[0];
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw new Error(`Failed to create restaurant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async updateRestaurant(id: string, restaurant: UpdateRestaurant): Promise<Restaurant | null> {
    try {
      const results = await db
        .update(restaurants)
        .set({
          ownerId: restaurant.ownerId,
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          email: restaurant.email,
          updatedAt: new Date()
        })
        .where(eq(restaurants.id, id))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return null;
    }
  }
  
  async deleteRestaurant(id: string): Promise<boolean> {
    try {
      const results = await db
        .delete(restaurants)
        .where(eq(restaurants.id, id))
        .returning();
      
      return results.length > 0;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return false;
    }
  }

  // Floor plan methods
  async getAllFloorPlans(restaurantId: string): Promise<FloorPlan[]> {
    try {
      return await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.restaurantId, restaurantId))
        .orderBy(floorPlans.name);
    } catch (error) {
      console.error('Error fetching floor plans:', error);
      return [];
    }
  }
  
  async getFloorPlan(id: string): Promise<FloorPlan | null> {
    try {
      const results = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.id, id));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching floor plan:', error);
      return null;
    }
  }
  
  async getDefaultFloorPlan(restaurantId: string): Promise<FloorPlan | null> {
    try {
      // Try to find the default floor plan
      const defaultResults = await db
        .select()
        .from(floorPlans)
        .where(and(
          eq(floorPlans.restaurantId, restaurantId),
          eq(floorPlans.isDefault, true)
        ));
      
      if (defaultResults.length > 0) {
        return defaultResults[0];
      }
      
      // If no default found, return any floor plan
      const anyResults = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.restaurantId, restaurantId))
        .limit(1);
      
      return anyResults.length > 0 ? anyResults[0] : null;
    } catch (error) {
      console.error('Error fetching default floor plan:', error);
      return null;
    }
  }
  
  async createFloorPlan(floorPlan: InsertFloorPlan): Promise<FloorPlan> {
    // Validate the layout using Zod schema
    try {
      layoutSchema.parse(floorPlan.layout);
    } catch (e) {
      console.error('Error validating floor plan layout:', e);
      throw new Error('Invalid floor plan layout structure');
    }
    
    try {
      // Check if restaurant exists
      const restaurantCheck = await this.getRestaurant(floorPlan.restaurantId);
      if (!restaurantCheck) {
        throw new Error(`Restaurant with ID ${floorPlan.restaurantId} does not exist`);
      }
      
      // If this is set as default, unset any existing default
      if (floorPlan.isDefault) {
        await db
          .update(floorPlans)
          .set({ isDefault: false })
          .where(and(
            eq(floorPlans.restaurantId, floorPlan.restaurantId),
            eq(floorPlans.isDefault, true)
          ));
      }
      
      // Create the new floor plan
      const results = await db
        .insert(floorPlans)
        .values({
          restaurantId: floorPlan.restaurantId,
          name: floorPlan.name,
          layout: floorPlan.layout,
          isDefault: floorPlan.isDefault,
          createdBy: floorPlan.createdBy
        })
        .returning();
      
      if (results.length === 0) {
        throw new Error('Failed to create floor plan');
      }
      
      return results[0];
    } catch (error) {
      console.error('Error creating floor plan:', error);
      throw new Error(`Failed to create floor plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async updateFloorPlan(id: string, floorPlan: UpdateFloorPlan): Promise<FloorPlan | null> {
    // If layout is provided, validate it
    if (floorPlan.layout) {
      try {
        layoutSchema.parse(floorPlan.layout);
      } catch (e) {
        console.error('Invalid floor plan layout:', e);
        throw new Error('Invalid floor plan layout structure');
      }
    }
    
    try {
      // If this is set as default, unset any existing default
      if (floorPlan.isDefault && floorPlan.restaurantId) {
        const plansToUpdate = await db
          .select()
          .from(floorPlans)
          .where(and(
            eq(floorPlans.restaurantId, floorPlan.restaurantId),
            eq(floorPlans.isDefault, true)
          ));
        
        // Filter out the current floor plan
        const otherDefaultPlans = plansToUpdate.filter(plan => plan.id !== id);
        
        // Update each plan individually
        for (const plan of otherDefaultPlans) {
          await db
            .update(floorPlans)
            .set({ isDefault: false })
            .where(eq(floorPlans.id, plan.id));
        }
      }
      
      // Update values
      const updateValues: any = {
        updatedAt: new Date()
      };
      
      if (floorPlan.restaurantId) updateValues.restaurantId = floorPlan.restaurantId;
      if (floorPlan.name) updateValues.name = floorPlan.name;
      if (floorPlan.layout) updateValues.layout = floorPlan.layout;
      if (floorPlan.isDefault !== undefined) updateValues.isDefault = floorPlan.isDefault;
      
      const results = await db
        .update(floorPlans)
        .set(updateValues)
        .where(eq(floorPlans.id, id))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error updating floor plan:', error);
      return null;
    }
  }
  
  async deleteFloorPlan(id: string): Promise<boolean> {
    try {
      console.log(`Deleting floor plan with ID: ${id}`);
      
      // First delete associated seating areas
      console.log(`Deleting associated seating areas for floor plan: ${id}`);
      const deleteAreasQuery = `DELETE FROM seating_areas WHERE id_floor_plan = $1`;
      await pool.query(deleteAreasQuery, [id]);
      
      // Then delete the floor plan
      console.log(`Now deleting the floor plan itself: ${id}`);
      const results = await db
        .delete(floorPlans)
        .where(eq(floorPlans.id, id))
        .returning();
      
      return results.length > 0;
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      throw new Error(`Failed to delete floor plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Seating Areas methods
  async getSeatingAreasByFloorPlan(floorPlanId: string): Promise<SeatingArea[]> {
    try {
      return await db
        .select()
        .from(seatingAreas)
        .where(eq(seatingAreas.floorPlanId, floorPlanId))
        .orderBy(seatingAreas.name);
    } catch (error) {
      console.error('Error fetching seating areas:', error);
      return [];
    }
  }

  async getSeatingArea(id: number): Promise<SeatingArea | null> {
    try {
      const query = `
        SELECT * FROM seating_areas WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Convert the raw database row to SeatingArea type
      const row = result.rows[0];
      return {
        id: Number(row.id),
        floorPlanId: row.id_floor_plan,
        name: row.name,
        capacityRange: row.capacity_range,
        description: row.description,
        x: row.x,
        y: row.y,
        properties: row.properties,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error fetching seating area:', error);
      return null;
    }
  }

  async createSeatingArea(seatingArea: InsertSeatingArea): Promise<SeatingArea> {
    try {
      console.log("Creating seating area with data:", JSON.stringify(seatingArea, null, 2));
      
      // Check if floor plan exists
      const floorPlanCheck = await this.getFloorPlan(seatingArea.floorPlanId);
      if (!floorPlanCheck) {
        throw new Error(`Floor plan with ID ${seatingArea.floorPlanId} does not exist`);
      }
      
      // Get the next available ID (we're using a manually managed bigint primary key)
      const maxIdResult = await pool.query(
        `SELECT MAX(id) as "maxId" FROM seating_areas`
      );
      const nextId = maxIdResult.rows[0]?.maxId ? Number(maxIdResult.rows[0].maxId) + 1 : 1;
      
      console.log("Using nextId:", nextId);
      
      // Use raw query via pool directly
      const insertQuery = `
        INSERT INTO seating_areas (id, id_floor_plan, name, capacity_range, description, x, y, properties) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `;
      
      console.log("Running SQL query with Pool directly");
      
      const params = [
        nextId, 
        seatingArea.floorPlanId, 
        seatingArea.name, 
        JSON.stringify(seatingArea.capacityRange), 
        seatingArea.description || null, 
        seatingArea.x, 
        seatingArea.y, 
        JSON.stringify(seatingArea.properties)
      ];
      
      // Use the pool directly instead of drizzle's db
      const results = await pool.query(insertQuery, params);
      
      if (results.rows.length === 0) {
        throw new Error('Failed to create seating area');
      }
      
      // Convert the raw database row to SeatingArea type
      const row = results.rows[0];
      console.log("Seating area created successfully:", JSON.stringify(row, null, 2));
      
      return {
        id: Number(row.id),
        floorPlanId: row.id_floor_plan,
        name: row.name,
        capacityRange: row.capacity_range,
        description: row.description,
        x: row.x,
        y: row.y,
        properties: row.properties,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error creating seating area:', error);
      throw new Error(`Failed to create seating area: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSeatingArea(id: number, seatingArea: UpdateSeatingArea): Promise<SeatingArea | null> {
    try {
      // Check if the seating area exists
      const existingSeatingArea = await this.getSeatingArea(id);
      if (!existingSeatingArea) {
        return null;
      }
      
      // If floor plan ID is changed, verify the new floor plan exists
      if (seatingArea.floorPlanId && seatingArea.floorPlanId !== existingSeatingArea.floorPlanId) {
        const floorPlanCheck = await this.getFloorPlan(seatingArea.floorPlanId);
        if (!floorPlanCheck) {
          throw new Error(`Floor plan with ID ${seatingArea.floorPlanId} does not exist`);
        }
      }
      
      // Update values
      const updateValues: any = {};
      
      if (seatingArea.floorPlanId) updateValues.floorPlanId = seatingArea.floorPlanId;
      if (seatingArea.name) updateValues.name = seatingArea.name;
      if (seatingArea.capacityRange) updateValues.capacityRange = seatingArea.capacityRange;
      if (seatingArea.description !== undefined) updateValues.description = seatingArea.description;
      if (seatingArea.x !== undefined) updateValues.x = seatingArea.x;
      if (seatingArea.y !== undefined) updateValues.y = seatingArea.y;
      if (seatingArea.properties) updateValues.properties = seatingArea.properties;
      
      const results = await db
        .update(seatingAreas)
        .set(updateValues)
        .where(eq(seatingAreas.id, id))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error updating seating area:', error);
      return null;
    }
  }

  async deleteSeatingArea(id: number): Promise<boolean> {
    try {
      const results = await db
        .delete(seatingAreas)
        .where(eq(seatingAreas.id, id))
        .returning();
      
      return results.length > 0;
    } catch (error) {
      console.error('Error deleting seating area:', error);
      return false;
    }
  }
  
  // Restaurant Users methods
  async getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]> {
    try {
      return await db
        .select()
        .from(restaurantUsers)
        .where(eq(restaurantUsers.restaurantId, restaurantId));
    } catch (error) {
      console.error('Error fetching restaurant users:', error);
      return [];
    }
  }
  
  async linkUserToRestaurant(userId: string, restaurantId: string, role: string): Promise<RestaurantUser> {
    try {
      console.log(`[storage] Starting linkUserToRestaurant: user=${userId}, restaurant=${restaurantId}, role=${role}`);
      
      // First check if the user exists directly in the database
      // This is more reliable than getUserById during a migration
      const userCheck = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.id, userId));
        
      const userExists = userCheck[0].count > 0;
      
      if (!userExists) {
        console.warn(`[storage] ⚠️ Warning: User ID ${userId} not found in database during association creation.`);
        // In development mode, we'll allow migration to proceed despite issues
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`User with ID ${userId} not found`);
        }
      }

      // Check if restaurant exists
      const restaurant = await this.getRestaurant(restaurantId);
      if (!restaurant) {
        throw new Error(`Restaurant with ID ${restaurantId} not found`);
      }
      
      // Check if the relationship already exists
      const existingRelationships = await db
        .select()
        .from(restaurantUsers)
        .where(and(
          eq(restaurantUsers.userId, userId),
          eq(restaurantUsers.restaurantId, restaurantId)
        ));
      
      if (existingRelationships.length > 0) {
        console.log(`[storage] Association already exists for user=${userId}, restaurant=${restaurantId}`);
        // If it exists but role is different, update it
        if (existingRelationships[0].role !== role) {
          console.log(`[storage] Updating role from ${existingRelationships[0].role} to ${role}`);
          const results = await db
            .update(restaurantUsers)
            .set({ role, updatedAt: new Date() })
            .where(and(
              eq(restaurantUsers.userId, userId),
              eq(restaurantUsers.restaurantId, restaurantId)
            ))
            .returning();
          
          return results[0];
        }
        
        return existingRelationships[0];
      }
      
      // Create a new relationship
      console.log(`[storage] Creating new association for user=${userId}, restaurant=${restaurantId}, role=${role}`);
      const results = await db
        .insert(restaurantUsers)
        .values({
          userId,
          restaurantId,
          role,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      if (results.length === 0) {
        throw new Error('Failed to link user to restaurant: no results returned');
      }
      
      console.log(`[storage] Successfully created association with ID=${results[0].id}`);
      return results[0];
    } catch (error) {
      console.error('[storage] Error linking user to restaurant:', error);
      throw new Error(`Failed to link user to restaurant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Current user methods
  async getCurrentUserRestaurants(userId: string): Promise<{ restaurant: Restaurant, role: string }[]> {
    try {
      // First, get the restaurant users for this user
      const userRestaurants = await db
        .select()
        .from(restaurantUsers)
        .where(eq(restaurantUsers.userId, userId));
      
      // If no restaurants found, return empty array
      if (userRestaurants.length === 0) {
        return [];
      }
      
      // Get all restaurant IDs
      const restaurantIds = userRestaurants.map(ur => ur.restaurantId);
      
      // Fetch all restaurants with matching IDs
      const result = [];
      
      for (const userRestaurant of userRestaurants) {
        // Get restaurant for this restaurant user
        const [restaurant] = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.id, userRestaurant.restaurantId));
        
        if (restaurant) {
          result.push({
            restaurant,
            role: userRestaurant.role
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching user restaurants:', error);
      return [];
    }
  }

  // User authentication methods
  async getUserById(id: string): Promise<User | null> {
    try {
      const results = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const results = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const results = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Check if username already exists
      const existingUsername = await this.getUserByUsername(user.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
      
      // Check if email already exists
      const existingEmail = await this.getUserByEmail(user.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
      
      // Hash password before storing
      // In a real app, you would hash the password with bcrypt or similar
      // For this example, we'll implement a simple hash function
      const hashedPassword = await this.hashPassword(user.password);
      
      // Create user values with proper ID mapping
      const userValues: any = {
        username: user.username,
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      };
      
      // If custom ID is provided (e.g., from Supabase), use it
      if (user.id) {
        userValues.id = user.id;
        console.log(`[storage] Creating user with explicit ID: ${user.id}`);
      }
      
      // Create user
      const results = await db
        .insert(users)
        .values(userValues)
        .returning();
      
      if (results.length === 0) {
        throw new Error('Failed to create user');
      }
      
      return results[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUser(id: string, user: UpdateUser): Promise<User | null> {
    try {
      // Check if user exists
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        return null;
      }
      
      // If username is changed, check if new username already exists
      if (user.username && user.username !== existingUser.username) {
        const existingUsername = await this.getUserByUsername(user.username);
        if (existingUsername) {
          throw new Error('Username already exists');
        }
      }
      
      // If email is changed, check if new email already exists
      if (user.email && user.email !== existingUser.email) {
        const existingEmail = await this.getUserByEmail(user.email);
        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }
      
      // Update values
      const updateValues: any = {
        updatedAt: new Date()
      };
      
      if (user.username) updateValues.username = user.username;
      if (user.firstName) updateValues.firstName = user.firstName;
      if (user.lastName) updateValues.lastName = user.lastName;
      if (user.email) updateValues.email = user.email;
      if (user.phoneNumber !== undefined) updateValues.phoneNumber = user.phoneNumber;
      if (user.role) updateValues.role = user.role;
      
      // If password is provided, hash it before storing
      if (user.password) {
        updateValues.password = await this.hashPassword(user.password);
      }
      
      const results = await db
        .update(users)
        .set(updateValues)
        .where(eq(users.id, id))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const results = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return results.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async validateUserCredentials(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByUsername(username);
      if (!user) {
        return null;
      }
      
      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error validating user credentials:', error);
      return null;
    }
  }
  
  // Helper methods for password hashing
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const scryptAsync = promisify(scrypt);
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
  
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      // Split the stored hash and salt
      const [hashed, salt] = hashedPassword.split(".");
      if (!hashed || !salt) {
        console.error('Invalid hashed password format');
        return false;
      }
      
      // Hash the supplied password with the same salt
      const scryptAsync = promisify(scrypt);
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
      
      // Compare the hashes using a time-constant comparison function
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
