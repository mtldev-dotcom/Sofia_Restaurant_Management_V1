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
  layoutSchema,
  users,
  restaurants,
  restaurantUsers,
  floorPlans,
  seatingAreas
} from "@shared/schema";
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';

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
  
  // Current user methods
  getCurrentUserRestaurants(userId: string): Promise<{ restaurant: Restaurant, role: string }[]>;
}

// Drizzle storage implementation
export class DatabaseStorage implements IStorage {
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
      const results = await db
        .delete(floorPlans)
        .where(eq(floorPlans.id, id))
        .returning();
      
      return results.length > 0;
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      return false;
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
      
      const result = await db.execute(query, [id]);
      
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
        x: Number(row.x),
        y: Number(row.y),
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
      // Check if floor plan exists
      const floorPlanCheck = await this.getFloorPlan(seatingArea.floorPlanId);
      if (!floorPlanCheck) {
        throw new Error(`Floor plan with ID ${seatingArea.floorPlanId} does not exist`);
      }
      
      // Get the next available ID (we're using a manually managed bigint primary key)
      const maxIdResult = await db.execute(
        `SELECT MAX(id) as "maxId" FROM seating_areas`
      );
      const nextId = maxIdResult.rows[0]?.maxId ? Number(maxIdResult.rows[0].maxId) + 1 : 1;
      
      // Create the new seating area with SQL query
      const insertQuery = `
        INSERT INTO seating_areas (id, id_floor_plan, name, capacity_range, description, x, y, properties) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `;
      
      const results = await db.execute(insertQuery, [
        nextId, 
        seatingArea.floorPlanId, 
        seatingArea.name, 
        JSON.stringify(seatingArea.capacityRange), 
        seatingArea.description, 
        seatingArea.x, 
        seatingArea.y, 
        JSON.stringify(seatingArea.properties)
      ]);
      
      if (results.rows.length === 0) {
        throw new Error('Failed to create seating area');
      }
      
      // Convert the raw database row to SeatingArea type
      const row = results.rows[0];
      return {
        id: Number(row.id),
        floorPlanId: row.id_floor_plan,
        name: row.name,
        capacityRange: row.capacity_range,
        description: row.description,
        x: Number(row.x),
        y: Number(row.y),
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
}

export const storage = new DatabaseStorage();
