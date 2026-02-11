import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  interval?: "month" | "year" | null;
  quantity: number;
  category: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  itemCount: number;
  monthlyTotal: number;
  oneTimeTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "cch_cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return [];
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (item.interval) {
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const monthlyTotal = items
    .filter(i => i.interval === "month")
    .reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);

  const oneTimeTotal = items
    .filter(i => !i.interval)
    .reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isOpen,
      setIsOpen,
      itemCount,
      monthlyTotal,
      oneTimeTotal,
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
