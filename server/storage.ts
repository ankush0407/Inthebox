import { 
  users, restaurants, lunchboxes, orders, orderItems,
  type User, type InsertUser,
  type Restaurant, type InsertRestaurant,
  type Lunchbox, type InsertLunchbox,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Restaurant operations
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  
  // Lunchbox operations
  getLunchboxesByRestaurant(restaurantId: string): Promise<Lunchbox[]>;
  getLunchbox(id: string): Promise<Lunchbox | undefined>;
  createLunchbox(lunchbox: InsertLunchbox): Promise<Lunchbox>;
  updateLunchbox(id: string, updates: Partial<InsertLunchbox>): Promise<Lunchbox | undefined>;
  deleteLunchbox(id: string): Promise<boolean>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByRestaurant(restaurantId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Order item operations
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants).where(eq(restaurants.isActive, true));
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant || undefined;
  }

  async getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId));
    return restaurant || undefined;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async updateRestaurant(id: string, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .update(restaurants)
      .set(updates)
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant || undefined;
  }

  async getLunchboxesByRestaurant(restaurantId: string): Promise<Lunchbox[]> {
    return await db.select().from(lunchboxes).where(eq(lunchboxes.restaurantId, restaurantId));
  }

  async getLunchbox(id: string): Promise<Lunchbox | undefined> {
    const [lunchbox] = await db.select().from(lunchboxes).where(eq(lunchboxes.id, id));
    return lunchbox || undefined;
  }

  async createLunchbox(lunchbox: InsertLunchbox): Promise<Lunchbox> {
    const [newLunchbox] = await db
      .insert(lunchboxes)
      .values(lunchbox)
      .returning();
    return newLunchbox;
  }

  async updateLunchbox(id: string, updates: Partial<InsertLunchbox>): Promise<Lunchbox | undefined> {
    const [lunchbox] = await db
      .update(lunchboxes)
      .set(updates)
      .where(eq(lunchboxes.id, id))
      .returning();
    return lunchbox || undefined;
  }

  async deleteLunchbox(id: string): Promise<boolean> {
    const result = await db.delete(lunchboxes).where(eq(lunchboxes.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status: status as any })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db
      .insert(orderItems)
      .values(orderItem)
      .returning();
    return newOrderItem;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
}

export const storage = new DatabaseStorage();
