import { 
  users, restaurants, lunchboxes, orders, orderItems, deliveryLocations, deliveryBuildings,
  type User, type InsertUser,
  type Restaurant, type InsertRestaurant,
  type Lunchbox, type InsertLunchbox,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type DeliveryLocation, type InsertDeliveryLocation,
  type DeliveryBuilding, type InsertDeliveryBuilding
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { withRetry } from "./dbRetry";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  linkOAuthAccount(userId: string, provider: string, providerId: string): Promise<User>;
  completeProfile(userId: string, role: string): Promise<User>;
  updateUserProfile(userId: string, profile: { fullName?: string; phoneNumber?: string; deliveryLocationId?: string }): Promise<User>;
  
  getDeliveryLocations(): Promise<DeliveryLocation[]>;
  getAllDeliveryLocations(): Promise<DeliveryLocation[]>;
  createDeliveryLocation(data: { name: string; address: string }): Promise<DeliveryLocation>;
  updateDeliveryLocation(id: string, data: { name?: string; address?: string; isActive?: boolean }): Promise<DeliveryLocation | null>;
  deleteDeliveryLocation(id: string): Promise<boolean>;
  
  getDeliveryBuildings(): Promise<DeliveryBuilding[]>;
  getAllDeliveryBuildings(): Promise<DeliveryBuilding[]>;
  getDeliveryBuildingsByLocation(locationId: string): Promise<DeliveryBuilding[]>;
  createDeliveryBuilding(data: InsertDeliveryBuilding): Promise<DeliveryBuilding>;
  updateDeliveryBuilding(id: string, data: Partial<InsertDeliveryBuilding>): Promise<DeliveryBuilding | null>;
  deleteDeliveryBuilding(id: string): Promise<boolean>;
  
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  
  getLunchboxesByRestaurant(restaurantId: string): Promise<Lunchbox[]>;
  getLunchbox(id: string): Promise<Lunchbox | undefined>;
  createLunchbox(lunchbox: InsertLunchbox): Promise<Lunchbox>;
  updateLunchbox(id: string, updates: Partial<InsertLunchbox>): Promise<Lunchbox | undefined>;
  deleteLunchbox(id: string): Promise<boolean>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByRestaurant(restaurantId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    });
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
      return user || undefined;
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return withRetry(async () => {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    });
  }

  async linkOAuthAccount(userId: string, provider: string, providerId: string): Promise<User> {
    return withRetry(async () => {
      const [user] = await db
        .update(users)
        .set({ provider, providerId })
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  async completeProfile(userId: string, role: string): Promise<User> {
    return withRetry(async () => {
      const [user] = await db
        .update(users)
        .set({ role: role as any, profileComplete: true })
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return withRetry(async () => {
      return await db.select().from(restaurants).where(eq(restaurants.isActive, true));
    });
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    return withRetry(async () => {
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
      return restaurant || undefined;
    });
  }

  async getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | undefined> {
    return withRetry(async () => {
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId));
      return restaurant || undefined;
    });
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    return withRetry(async () => {
      const [newRestaurant] = await db
        .insert(restaurants)
        .values(restaurant)
        .returning();
      return newRestaurant;
    });
  }

  async updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    return withRetry(async () => {
      const [restaurant] = await db
        .update(restaurants)
        .set(updates)
        .where(eq(restaurants.id, id))
        .returning();
      return restaurant || undefined;
    });
  }

  async getLunchboxesByRestaurant(restaurantId: string): Promise<Lunchbox[]> {
    return withRetry(async () => {
      return await db.select().from(lunchboxes).where(eq(lunchboxes.restaurantId, restaurantId));
    });
  }

  async getLunchbox(id: string): Promise<Lunchbox | undefined> {
    return withRetry(async () => {
      const [lunchbox] = await db.select().from(lunchboxes).where(eq(lunchboxes.id, id));
      return lunchbox || undefined;
    });
  }

  async createLunchbox(lunchbox: InsertLunchbox): Promise<Lunchbox> {
    return withRetry(async () => {
      const [newLunchbox] = await db
        .insert(lunchboxes)
        .values(lunchbox)
        .returning();
      return newLunchbox;
    });
  }

  async updateLunchbox(id: string, updates: Partial<InsertLunchbox>): Promise<Lunchbox | undefined> {
    return withRetry(async () => {
      const [lunchbox] = await db
        .update(lunchboxes)
        .set(updates)
        .where(eq(lunchboxes.id, id))
        .returning();
      return lunchbox || undefined;
    });
  }

  async deleteLunchbox(id: string): Promise<boolean> {
    return withRetry(async () => {
      const result = await db.delete(lunchboxes).where(eq(lunchboxes.id, id));
      return (result.rowCount || 0) > 0;
    });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    return withRetry(async () => {
      const [newOrder] = await db
        .insert(orders)
        .values(order)
        .returning();
      return newOrder;
    });
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return withRetry(async () => {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      return order || undefined;
    });
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return withRetry(async () => {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.customerId, customerId))
        .orderBy(desc(orders.createdAt));
    });
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return withRetry(async () => {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.restaurantId, restaurantId))
        .orderBy(desc(orders.createdAt));
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return withRetry(async () => {
      const [order] = await db
        .update(orders)
        .set({ status: status as any })
        .where(eq(orders.id, id))
        .returning();
      return order || undefined;
    });
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    return withRetry(async () => {
      const [newOrderItem] = await db
        .insert(orderItems)
        .values(orderItem)
        .returning();
      return newOrderItem;
    });
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return withRetry(async () => {
      return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    });
  }

  async updateUserProfile(userId: string, profile: { fullName?: string; phoneNumber?: string; deliveryLocationId?: string }): Promise<User> {
    return withRetry(async () => {
      const [user] = await db
        .update(users)
        .set(profile)
        .where(eq(users.id, userId))
        .returning();
      return user;
    });
  }

  async getDeliveryLocations(): Promise<DeliveryLocation[]> {
    return withRetry(async () => {
      return await db.select().from(deliveryLocations).where(eq(deliveryLocations.isActive, true));
    });
  }

  async getAllDeliveryLocations(): Promise<DeliveryLocation[]> {
    return withRetry(async () => {
      return await db.select().from(deliveryLocations);
    });
  }

  async createDeliveryLocation(data: { name: string; address: string }): Promise<DeliveryLocation> {
    return withRetry(async () => {
      const [location] = await db.insert(deliveryLocations).values({
        name: data.name,
        address: data.address,
        isActive: true,
      }).returning();
      return location;
    });
  }

  async updateDeliveryLocation(id: string, data: { name?: string; address?: string; isActive?: boolean }): Promise<DeliveryLocation | null> {
    return withRetry(async () => {
      const [location] = await db.update(deliveryLocations)
        .set(data)
        .where(eq(deliveryLocations.id, id))
        .returning();
      return location || null;
    });
  }

  async deleteDeliveryLocation(id: string): Promise<boolean> {
    return withRetry(async () => {
      const result = await db.delete(deliveryLocations).where(eq(deliveryLocations.id, id));
      return (result.rowCount || 0) > 0;
    });
  }

  async getDeliveryBuildings(): Promise<DeliveryBuilding[]> {
    return withRetry(async () => {
      return await db.select().from(deliveryBuildings).where(eq(deliveryBuildings.isActive, true));
    });
  }

  async getAllDeliveryBuildings(): Promise<DeliveryBuilding[]> {
    return withRetry(async () => {
      return await db.select().from(deliveryBuildings);
    });
  }

  async getDeliveryBuildingsByLocation(locationId: string): Promise<DeliveryBuilding[]> {
    return withRetry(async () => {
      return await db.select().from(deliveryBuildings)
        .where(and(eq(deliveryBuildings.deliveryLocationId, locationId), eq(deliveryBuildings.isActive, true)));
    });
  }

  async createDeliveryBuilding(data: InsertDeliveryBuilding): Promise<DeliveryBuilding> {
    return withRetry(async () => {
      const [building] = await db.insert(deliveryBuildings).values(data).returning();
      return building;
    });
  }

  async updateDeliveryBuilding(id: string, data: Partial<InsertDeliveryBuilding>): Promise<DeliveryBuilding | null> {
    return withRetry(async () => {
      const [building] = await db.update(deliveryBuildings)
        .set(data)
        .where(eq(deliveryBuildings.id, id))
        .returning();
      return building || null;
    });
  }

  async deleteDeliveryBuilding(id: string): Promise<boolean> {
    return withRetry(async () => {
      const result = await db.delete(deliveryBuildings).where(eq(deliveryBuildings.id, id));
      return (result.rowCount || 0) > 0;
    });
  }
}

export const storage = new DatabaseStorage();
