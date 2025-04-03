import { users, type User, type InsertUser, type FloorPlan, type InsertFloorPlan } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Floor plan methods
  getAllFloorPlans(): Promise<FloorPlan[]>;
  getFloorPlan(id: number): Promise<FloorPlan | undefined>;
  createFloorPlan(floorPlan: InsertFloorPlan): Promise<FloorPlan>;
  updateFloorPlan(id: number, floorPlan: InsertFloorPlan): Promise<FloorPlan | undefined>;
  deleteFloorPlan(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private floorPlans: Map<number, FloorPlan>;
  private userIdCounter: number;
  private floorPlanIdCounter: number;

  constructor() {
    this.users = new Map();
    this.floorPlans = new Map();
    this.userIdCounter = 1;
    this.floorPlanIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Floor plan methods
  async getAllFloorPlans(): Promise<FloorPlan[]> {
    return Array.from(this.floorPlans.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  
  async getFloorPlan(id: number): Promise<FloorPlan | undefined> {
    return this.floorPlans.get(id);
  }
  
  async createFloorPlan(insertFloorPlan: InsertFloorPlan): Promise<FloorPlan> {
    const id = this.floorPlanIdCounter++;
    const now = new Date();
    
    const floorPlan: FloorPlan = {
      ...insertFloorPlan,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.floorPlans.set(id, floorPlan);
    return floorPlan;
  }
  
  async updateFloorPlan(id: number, insertFloorPlan: InsertFloorPlan): Promise<FloorPlan | undefined> {
    const existingFloorPlan = this.floorPlans.get(id);
    
    if (!existingFloorPlan) {
      return undefined;
    }
    
    const updatedFloorPlan: FloorPlan = {
      ...existingFloorPlan,
      ...insertFloorPlan,
      updatedAt: new Date()
    };
    
    this.floorPlans.set(id, updatedFloorPlan);
    return updatedFloorPlan;
  }
  
  async deleteFloorPlan(id: number): Promise<boolean> {
    return this.floorPlans.delete(id);
  }
}

export const storage = new MemStorage();
