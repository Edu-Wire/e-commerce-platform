import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '../types';
import api from '../lib/api';

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post<{ success: boolean; data: { token: string; admin: AdminUser } }>('/auth/admin/login', {
            email,
            password,
          });
          const { token, admin } = response.data.data;
          set({ admin, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ admin: null, token: null });
      },

      initialize: () => {
        const { token } = get();
        if (!token) {
          set({ admin: null });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ admin: state.admin, token: state.token }),
    }
  )
);

export default useAdminAuthStore;
