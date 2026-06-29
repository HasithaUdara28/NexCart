import { create } from 'zustand';
import api from '../lib/axios';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,

  fetchCart: async () => {
    const { data } = await api.get('/api/cart');
    set({
      items: data.items,
      total: data.total,
      itemCount: data.items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0),
    });
  },

  addToCart: async (productId, quantity) => {
    await api.post('/api/cart', { productId, quantity });
    await get().fetchCart();
  },

  updateItem: async (productId, quantity) => {
    await api.put(`/api/cart/${productId}`, { quantity });
    await get().fetchCart();
  },

  removeItem: async (productId) => {
    await api.delete(`/api/cart/${productId}`);
    await get().fetchCart();
  },

  clearCart: async () => {
    await api.delete('/api/cart');
    set({ items: [], total: 0, itemCount: 0 });
  },
}));
