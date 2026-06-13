import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductCondition } from '../types';

export interface WishlistItem {
  product_id: number;
  name: string;
  slug: string;
  image?: string;
  mrp: number;
  price: number;
  condition: ProductCondition;
  sku: string;
  stock_quantity: number;
}

interface WishlistState {
  items: WishlistItem[];
}

interface WishlistActions {
  addItem: (item: WishlistItem) => void;
  removeItem: (product_id: number) => void;
  clearWishlist: () => void;
  isInWishlist: (product_id: number) => boolean;
}

type WishlistStore = WishlistState & WishlistActions;

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: WishlistItem) => {
        set(state => {
          if (!state.items.find(i => i.product_id === item.product_id)) {
            return { items: [...state.items, item] };
          }
          return state;
        });
      },

      removeItem: (product_id: number) => {
        set(state => ({ items: state.items.filter(i => i.product_id !== product_id) }));
      },

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (product_id: number) => !!get().items.find(i => i.product_id === product_id),
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
