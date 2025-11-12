import { createContext, ReactNode, useContext, useState, useEffect, useRef } from "react";
import { Lunchbox } from "@shared/schema";
import { useAuth } from "./use-auth";

export interface CartItem {
  lunchbox: Lunchbox;
  quantity: number;
  restaurantName: string;
  restaurantDeliveryFee: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (lunchbox: Lunchbox, restaurantName: string, restaurantDeliveryFee: number) => void;
  removeItem: (lunchboxId: string) => void;
  updateQuantity: (lunchboxId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  deliveryFee: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const previousUserIdRef = useRef<string | null | undefined>(undefined);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    const currentUserId = user?.id || null;
    
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousUserIdRef.current = currentUserId;
      return;
    }
    
    if (previousUserIdRef.current !== currentUserId) {
      setItems([]);
      previousUserIdRef.current = currentUserId;
    }
  }, [user?.id]);

  const addItem = (lunchbox: Lunchbox, restaurantName: string, restaurantDeliveryFee: number) => {
    setItems(current => {
      const existingItem = current.find(item => item.lunchbox.id === lunchbox.id);
      
      if (existingItem) {
        return current.map(item =>
          item.lunchbox.id === lunchbox.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...current, { lunchbox, quantity: 1, restaurantName, restaurantDeliveryFee }];
    });
  };

  const removeItem = (lunchboxId: string) => {
    setItems(current => current.filter(item => item.lunchbox.id !== lunchboxId));
  };

  const updateQuantity = (lunchboxId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(lunchboxId);
      return;
    }
    
    setItems(current =>
      current.map(item =>
        item.lunchbox.id === lunchboxId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.lunchbox.price) * item.quantity);
  }, 0);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  
  // Get delivery fee from the first item's restaurant (assuming single restaurant orders)
  const deliveryFee = items.length > 0 ? items[0].restaurantDeliveryFee : 0;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      itemCount,
      deliveryFee
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
