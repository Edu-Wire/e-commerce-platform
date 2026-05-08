import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, Order, OrderStatus, PaginationMeta } from '../types';

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus | '';
  order_type?: string;
  search?: string;
}

interface OrderListResponse {
  orders: Order[];
  meta: PaginationMeta;
}

export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      const res = await api.get<ApiResponse<OrderListResponse>>(`/admin/orders?${params}`);
      return res.data;
    },
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
      return res.data.data;
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await api.patch<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders', vars.id] });
    },
  });
}
