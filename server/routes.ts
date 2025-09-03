import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertRestaurantSchema, insertLunchboxSchema, insertOrderSchema, insertOrderItemSchema, Order } from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Object storage routes
  app.post("/api/objects/upload", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve public objects
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Restaurant routes
  app.get("/api/restaurants", async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      res.json(restaurants);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching restaurants: " + error.message });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching restaurant: " + error.message });
    }
  });

  // Get restaurant by owner
  app.get("/api/restaurants/owner/:ownerId", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.params.ownerId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching restaurant: " + error.message });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.sendStatus(403);
    }

    try {
      const restaurantData = insertRestaurantSchema.parse(req.body);
      const restaurant = await storage.createRestaurant(restaurantData);
      res.status(201).json(restaurant);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating restaurant: " + error.message });
    }
  });

  app.put("/api/restaurants/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Check if user owns this restaurant or is admin
      if (restaurant.ownerId !== req.user.id && req.user.role !== "admin") {
        return res.sendStatus(403);
      }

      const updates = insertRestaurantSchema.partial().parse(req.body);
      const updatedRestaurant = await storage.updateRestaurant(req.params.id, updates);
      res.json(updatedRestaurant);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating restaurant: " + error.message });
    }
  });

  // Lunchbox routes
  app.get("/api/restaurants/:restaurantId/lunchboxes", async (req, res) => {
    try {
      const lunchboxes = await storage.getLunchboxesByRestaurant(req.params.restaurantId);
      res.json(lunchboxes);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching lunchboxes: " + error.message });
    }
  });

  app.post("/api/restaurants/:restaurantId/lunchboxes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      // Check if user owns this restaurant or is admin
      const restaurant = await storage.getRestaurant(req.params.restaurantId);
      if (!restaurant || (restaurant.ownerId !== req.user.id && req.user.role !== "admin")) {
        return res.sendStatus(403);
      }

      const lunchboxData = insertLunchboxSchema.parse({
        ...req.body,
        restaurantId: req.params.restaurantId
      });
      const lunchbox = await storage.createLunchbox(lunchboxData);
      res.status(201).json(lunchbox);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating lunchbox: " + error.message });
    }
  });

  app.put("/api/lunchboxes/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const lunchbox = await storage.getLunchbox(req.params.id);
      if (!lunchbox) {
        return res.status(404).json({ message: "Lunchbox not found" });
      }

      const restaurant = await storage.getRestaurant(lunchbox.restaurantId!);
      if (!restaurant || (restaurant.ownerId !== req.user.id && req.user.role !== "admin")) {
        return res.sendStatus(403);
      }

      const updates = insertLunchboxSchema.partial().parse(req.body);
      const updatedLunchbox = await storage.updateLunchbox(req.params.id, updates);
      res.json(updatedLunchbox);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating lunchbox: " + error.message });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        customerId: req.user.id
      });
      const order = await storage.createOrder(orderData);

      // Create order items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const orderItemData = insertOrderItemSchema.parse({
            ...item,
            orderId: order.id
          });
          await storage.createOrderItem(orderItemData);
        }
      }

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating order: " + error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      let orders: Order[] = [];
      if (req.user.role === "customer") {
        orders = await storage.getOrdersByCustomer(req.user.id);
      } else if (req.user.role === "restaurant_owner") {
        const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
        if (!restaurant) {
          return res.json([]);
        }
        orders = await storage.getOrdersByRestaurant(restaurant.id);
      } else {
        // Admin can see all orders - implement if needed
        orders = [];
      }
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching orders: " + error.message });
    }
  });

  app.get("/api/orders/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check authorization
      if (req.user.role === "customer" && order.customerId !== req.user.id) {
        return res.sendStatus(403);
      }
      if (req.user.role === "restaurant_owner") {
        const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
        if (!restaurant || order.restaurantId !== restaurant.id) {
          return res.sendStatus(403);
        }
      }

      const items = await storage.getOrderItems(req.params.id);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching order items: " + error.message });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only restaurant owners can update their order status
      if (req.user.role === "restaurant_owner") {
        const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
        if (!restaurant || order.restaurantId !== restaurant.id) {
          return res.sendStatus(403);
        }
      } else if (req.user.role !== "admin") {
        return res.sendStatus(403);
      }

      const updatedOrder = await storage.updateOrderStatus(req.params.id, req.body.status);
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating order status: " + error.message });
    }
  });

  // Profile routes
  app.get("/api/profile", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });

  app.put("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { fullName, phoneNumber, deliveryLocationId } = req.body;
      const updatedUser = await storage.updateUserProfile(req.user!.id, {
        fullName,
        phoneNumber,
        deliveryLocationId,
      });
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/delivery-locations", async (req, res) => {
    try {
      const locations = await storage.getDeliveryLocations();
      res.json(locations);
    } catch (error: any) {
      console.error("Get delivery locations error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
