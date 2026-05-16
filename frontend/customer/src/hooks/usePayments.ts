import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface PendingPaymentItem {
  product_id?: number;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
}

export interface PendingPayment {
  id: number;
  auction_id?: number | null;
  order_number: string;
  total_amount: number;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  items: PendingPaymentItem[];
}

export function usePendingPayments(enabled = true) {
  return useQuery({
    queryKey: ['auctions', 'pending-payments'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PendingPayment[] }>(
        '/auctions/pending-payments'
      );
      return res.data.data;
    },
    enabled,
    refetchInterval: 10000,
  });
}

export function usePayAuctionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      orderId: number;
      source: 'wallet' | 'demo';
      payment_method_id?: number;
    }) => {
      const res = await api.post<{
        success: boolean;
        data: {
          order: unknown;
          gateway_ref: string;
          paid_via: string;
          amount: number;
        };
      }>(`/orders/${payload.orderId}/pay`, {
        source: payload.source,
        payment_method_id: payload.payment_method_id,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions', 'pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['auctions', 'winning'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
