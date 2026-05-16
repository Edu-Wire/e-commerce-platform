import { create } from 'zustand';
import { api } from '../lib/api';
import type { Customer } from '../types';

interface AuthState {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  updateProfile: (data: { name?: string; phone?: string; dob?: string; address?: Record<string, unknown>; settings?: Record<string, any> }) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  customer_type: 'b2c' | 'b2b';
  company_name?: string;
  gst_number?: string;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  customer: null,
  token: null,
  isLoading: false,

  initialize: () => {
    try {
      const token = localStorage.getItem('auth_token');
      const customerStr = localStorage.getItem('auth_customer');
      if (token && customerStr) {
        const customer = JSON.parse(customerStr) as Customer;
        set({ token, customer });
      }
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_customer');
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ success: boolean; data: { token: string; customer: Customer } }>(
        '/auth/login',
        { email, password }
      );
      const { token, customer } = res.data.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_customer', JSON.stringify(customer));
      set({ token, customer, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ success: boolean; data: { token: string; customer: Customer } }>(
        '/auth/register',
        data
      );
      const { token, customer } = res.data.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_customer', JSON.stringify(customer));
      set({ token, customer, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_customer');
    set({ token: null, customer: null });
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: Record<string, unknown> }) => {
    set({ isLoading: true });
    try {
      const res = await api.patch<{ success: boolean; data: Customer }>(
        '/auth/profile',
        data
      );
      const customer = res.data.data;
      localStorage.setItem('auth_customer', JSON.stringify(customer));
      set({ customer, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  }
}));
