import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface WalletSummary {
  balance: number;
  held: number;
  available: number;
  stats: {
    total_added: number;
    total_spent: number;
    winnings_received: number;
    pending_refunds: number;
    pending_refund_count: number;
  };
  limits: {
    daily_deposit_limit: number;
    daily_withdrawal_limit: number;
    monthly_deposit_limit: number;
    daily_deposit_used: number;
    daily_withdrawal_used: number;
    monthly_deposit_used: number;
  };
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: string;
  title: string;
  description: string | null;
  status: string;
  balance_after: string;
  payment_method_label?: string;
  payment_method_type?: string;
  last_four?: string;
  reference_id?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  type: 'card' | 'upi' | 'bank';
  label: string;
  last_four: string | null;
  is_default: boolean;
  created_at: string;
}

export function useWalletSummary(enabled = true) {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: WalletSummary }>('/wallet');
      return res.data.data;
    },
    enabled,
  });
}

export function useWalletTransactions(tab: string, enabled = true) {
  return useQuery({
    queryKey: ['wallet', 'transactions', tab],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: WalletTransaction[];
        meta?: { total: number };
      }>(`/wallet/transactions?tab=${tab}&limit=50`);
      return { transactions: res.data.data, total: res.data.meta?.total ?? res.data.data.length };
    },
    enabled,
  });
}

export function usePaymentMethods(enabled = true) {
  return useQuery({
    queryKey: ['wallet', 'payment-methods'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PaymentMethod[] }>('/wallet/payment-methods');
      return res.data.data;
    },
    enabled,
  });
}

export function useWalletMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
  };

  const deposit = useMutation({
    mutationFn: async (payload: { amount: number; payment_method_id?: number }) => {
      const res = await api.post('/wallet/deposit/demo', payload);
      return res.data.data;
    },
    onSuccess: invalidate,
  });

  const withdraw = useMutation({
    mutationFn: async (payload: { amount: number; payment_method_id?: number }) => {
      const res = await api.post('/wallet/withdraw', payload);
      return res.data.data;
    },
    onSuccess: invalidate,
  });

  const addPaymentMethod = useMutation({
    mutationFn: async (payload: {
      type: 'card' | 'upi' | 'bank';
      label?: string;
      last_four?: string;
      set_default?: boolean;
    }) => {
      const res = await api.post('/wallet/payment-methods', payload);
      return res.data.data;
    },
    onSuccess: invalidate,
  });

  const removePaymentMethod = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/wallet/payment-methods/${id}`);
    },
    onSuccess: invalidate,
  });

  return { deposit, withdraw, addPaymentMethod, removePaymentMethod };
}
