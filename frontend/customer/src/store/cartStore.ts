import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  buyNowItem: CartItem | null;
  isDrawerOpen: boolean;
  lastAddedItem: (CartItem & { category_slug?: string }) | null;
}

interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  setBuyNowItem: (item: CartItem | null) => void;
  setDrawerOpen: (open: boolean) => void;
  setLastAddedItem: (item: CartItem | null) => void;
}

interface CartComputed {
  totalItems: () => number;
  totalMrp: () => number;
  totalPrice: () => number;
  totalSavings: () => number;
}

type CartStore = CartState & CartActions & CartComputed;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      buyNowItem: null,
      isDrawerOpen: false,
      lastAddedItem: null,

      setBuyNowItem: (item: CartItem | null) => set({ buyNowItem: item }),
      setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),
      setLastAddedItem: (item: CartItem | null) => set({ lastAddedItem: item }),

      addItem: (item: CartItem) => {
        set(state => {
          const existing = state.items.find(i => i.product_id === item.product_id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock_quantity) }
                  : i
              )
            };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem: (product_id: number) => {
        set(state => ({ items: state.items.filter(i => i.product_id !== product_id) }));
      },

      updateQuantity: (product_id: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(product_id);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.product_id === product_id
              ? { ...i, quantity: Math.min(quantity, i.stock_quantity) }
              : i
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.length,
      totalMrp: () => get().items.reduce((sum, i) => sum + i.mrp * i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalSavings: () => {
        const mrp = get().totalMrp();
        const price = get().totalPrice();
        return mrp - price;
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);
