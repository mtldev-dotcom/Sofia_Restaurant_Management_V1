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
  type FloorPlanElement,
  layoutSchema
} from "@shared/schema";
import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

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
  
  // Restaurant Users methods
  getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]>;
  
  // Current user methods
  getCurrentUserRestaurants(userId: string): Promise<{ restaurant: Restaurant, role: string }[]>;
}

// Supabase storage implementation
export class SupabaseStorage implements IStorage {
  // Restaurant methods
  async getRestaurant(id: string): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
    
    return data as Restaurant;
  }
  
  async getAllRestaurants(): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
    
    return data as Restaurant[];
  }
  
  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', ownerId)
      .order('name');
    
    if (error) {
      console.error('Error fetching owner restaurants:', error);
      return [];
    }
    
    return data as Restaurant[];
  }
  
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurant)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating restaurant:', error);
      throw new Error(`Failed to create restaurant: ${error.message}`);
    }
    
    return data as Restaurant;
  }
  
  async updateRestaurant(id: string, restaurant: UpdateRestaurant): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .update(restaurant)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating restaurant:', error);
      return null;
    }
    
    return data as Restaurant;
  }
  
  async deleteRestaurant(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting restaurant:', error);
      return false;
    }
    
    return true;
  }

  // Floor plan methods
  async getAllFloorPlans(restaurantId: string): Promise<FloorPlan[]> {
    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name');
    
    if (error) {
      console.error('Error fetching floor plans:', error);
      return [];
    }
    
    return data as FloorPlan[];
  }
  
  async getFloorPlan(id: string): Promise<FloorPlan | null> {
    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching floor plan:', error);
      return null;
    }
    
    return data as FloorPlan;
  }
  
  async getDefaultFloorPlan(restaurantId: string): Promise<FloorPlan | null> {
    const { data, error } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_default', true)
      .single();
    
    if (error) {
      // If no default floor plan exists, this will error with a 'No rows matched' error
      if (error.code === 'PGRST116') {
        // No default floor plan, let's try to get any floor plan
        const { data: anyFloorPlan, error: anyError } = await supabase
          .from('floor_plans')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .limit(1)
          .single();
        
        if (anyError) {
          console.error('Error fetching any floor plan:', anyError);
          return null;
        }
        
        return anyFloorPlan as FloorPlan;
      }
      
      console.error('Error fetching default floor plan:', error);
      return null;
    }
    
    return data as FloorPlan;
  }
  
  async createFloorPlan(floorPlan: InsertFloorPlan): Promise<FloorPlan> {
    // Validate the layout using Zod schema
    try {
      layoutSchema.parse(floorPlan.layout);
    } catch (e) {
      console.error('Invalid floor plan layout:', e);
      throw new Error('Invalid floor plan layout structure');
    }
    
    // If this is set as default, unset any existing default
    if (floorPlan.isDefault) {
      await supabase
        .from('floor_plans')
        .update({ is_default: false })
        .eq('restaurant_id', floorPlan.restaurantId)
        .eq('is_default', true);
    }
    
    const { data, error } = await supabase
      .from('floor_plans')
      .insert({
        restaurant_id: floorPlan.restaurantId,
        name: floorPlan.name,
        layout: floorPlan.layout,
        is_default: floorPlan.isDefault,
        created_by: floorPlan.createdBy
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating floor plan:', error);
      throw new Error(`Failed to create floor plan: ${error.message}`);
    }
    
    return data as FloorPlan;
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
    
    // If this is set as default, unset any existing default
    if (floorPlan.isDefault && floorPlan.restaurantId) {
      await supabase
        .from('floor_plans')
        .update({ is_default: false })
        .eq('restaurant_id', floorPlan.restaurantId)
        .eq('is_default', true)
        .neq('id', id);
    }
    
    // Transform fields to match database column names
    const updateData: any = {};
    if (floorPlan.restaurantId) updateData.restaurant_id = floorPlan.restaurantId;
    if (floorPlan.name) updateData.name = floorPlan.name;
    if (floorPlan.layout) updateData.layout = floorPlan.layout;
    if (floorPlan.isDefault !== undefined) updateData.is_default = floorPlan.isDefault;
    
    const { data, error } = await supabase
      .from('floor_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating floor plan:', error);
      return null;
    }
    
    return data as FloorPlan;
  }
  
  async deleteFloorPlan(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('floor_plans')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting floor plan:', error);
      return false;
    }
    
    return true;
  }
  
  // Restaurant Users methods
  async getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]> {
    const { data, error } = await supabase
      .from('restaurant_users')
      .select('*')
      .eq('restaurant_id', restaurantId);
    
    if (error) {
      console.error('Error fetching restaurant users:', error);
      return [];
    }
    
    return data as RestaurantUser[];
  }
  
  // Current user methods
  async getCurrentUserRestaurants(userId: string): Promise<{ restaurant: Restaurant, role: string }[]> {
    const { data, error } = await supabase
      .from('restaurant_users')
      .select(`
        role,
        restaurants:restaurant_id (*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user restaurants:', error);
      return [];
    }
    
    return data.map((item: any) => ({
      restaurant: item.restaurants as Restaurant,
      role: item.role as string
    }));
  }
}

export const storage = new SupabaseStorage();
